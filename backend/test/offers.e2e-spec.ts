import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';

// All tests in this file share a real DB connection + mocked Cloudinary.
// NestJS bootstrap can be slow, so extend the timeout.
jest.setTimeout(30000);

// ---------------------------------------------------------------------------
// Shared mock values
// ---------------------------------------------------------------------------

const MOCK_UPLOAD_RESULT = {
  url: 'https://res.cloudinary.com/mock/image/upload/bionl/offers/offer-img.jpg',
  publicId: 'bionl/offers/offer-img-mock-id',
};

const MOCK_UPLOAD_RESULT_2 = {
  url: 'https://res.cloudinary.com/mock/image/upload/bionl/offers/offer-img-v2.jpg',
  publicId: 'bionl/offers/offer-img-mock-id-v2',
};

// A minimal buffer that satisfies multer's memory-storage pipeline.
// The MIME type is set by the .attach() call, not the actual bytes.
const dummyImageBuffer = Buffer.from('dummy image data');

// ---------------------------------------------------------------------------
// Date helpers — generates ISO date strings relative to now
// ---------------------------------------------------------------------------

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// An offer that is currently active: started yesterday, ends tomorrow
const ACTIVE_START = daysFromNow(-1);
const ACTIVE_END = daysFromNow(1);

// An offer whose window is entirely in the past
const PAST_START = daysFromNow(-10);
const PAST_END = daysFromNow(-2);

// An offer whose window is entirely in the future
const FUTURE_START = daysFromNow(5);
const FUTURE_END = daysFromNow(10);

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Offers API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mockUploadFile: jest.Mock;
  let mockDeleteFile: jest.Mock;

  // Shared IDs set by create tests and consumed by later tests
  let activeOfferId: string;
  let offerWithImageId: string;

  beforeAll(async () => {
    mockUploadFile = jest.fn().mockResolvedValue(MOCK_UPLOAD_RESULT);
    mockDeleteFile = jest.fn().mockResolvedValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Bypass real JWT validation on all admin endpoints
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      // Prevent any real Cloudinary API calls during tests
      .overrideProvider(CloudinaryService)
      .useValue({ uploadFile: mockUploadFile, deleteFile: mockDeleteFile })
      .compile();

    app = moduleFixture.createNestApplication();
    // Mirror the global ValidationPipe setup used in main.ts
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Purge any stale offers from previous failed runs (title-scoped, safe)
    await cleanupOwnedData(prisma);
  });

  afterAll(async () => {
    await cleanupOwnedData(prisma);
    await app.close();
  });

  // ---------------------------------------------------------------------------
  // Helper: deletes only the offers created by this suite, by title.
  // Using title instead of ID makes cleanup safe even if create calls fail.
  // ---------------------------------------------------------------------------

  async function cleanupOwnedData(p: PrismaService) {
    await p.offer.deleteMany({
      where: {
        titleEn: {
          in: [
            'E2E Active Offer',
            'E2E Past Offer',
            'E2E Future Offer',
            'E2E Banner Offer',
            'E2E Offer With Image',
            'E2E Offer No Image',
            'E2E Offer For Delete',
            'E2E Offer For Update',
          ],
        },
      },
    });
  }

  // ---------------------------------------------------------------------------
  // Seed helper: insert an offer directly via Prisma (avoids HTTP layer)
  // ---------------------------------------------------------------------------

  async function seedOffer(overrides: {
    titleEn: string;
    startDate: string;
    endDate: string;
    showInTopBanner?: boolean;
    imageUrl?: string;
    cloudinaryPublicId?: string;
  }) {
    return prisma.offer.create({
      data: {
        titleAr: 'عرض تجريبي',
        titleEn: overrides.titleEn,
        startDate: new Date(overrides.startDate),
        endDate: new Date(overrides.endDate),
        showInTopBanner: overrides.showInTopBanner ?? false,
        imageUrl: overrides.imageUrl ?? null,
        cloudinaryPublicId: overrides.cloudinaryPublicId ?? null,
      },
    });
  }

  // ===========================================================================
  // 1. GET /offers — Public Active Offers
  // ===========================================================================

  describe('GET /offers (public)', () => {
    let seededActiveId: string;

    beforeAll(async () => {
      // Seed one active, one past, and one future offer
      const active = await seedOffer({ titleEn: 'E2E Active Offer', startDate: ACTIVE_START, endDate: ACTIVE_END });
      seededActiveId = active.id;
      await seedOffer({ titleEn: 'E2E Past Offer', startDate: PAST_START, endDate: PAST_END });
      await seedOffer({ titleEn: 'E2E Future Offer', startDate: FUTURE_START, endDate: FUTURE_END });
    });

    it('returns HTTP 200', async () => {
      await request(app.getHttpServer()).get('/offers').expect(200);
    });

    it('response contains message, data array, and meta.total', async () => {
      const response = await request(app.getHttpServer()).get('/offers').expect(200);

      expect(response.body.message).toBe('Active offers retrieved successfully');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(typeof response.body.meta.total).toBe('number');
    });

    it('includes the active offer but excludes past and future offers', async () => {
      const response = await request(app.getHttpServer()).get('/offers').expect(200);

      const ids: string[] = response.body.data.map((o: any) => o.id);
      expect(ids).toContain(seededActiveId);

      const titles: string[] = response.body.data.map((o: any) => o.titleEn);
      expect(titles).not.toContain('E2E Past Offer');
      expect(titles).not.toContain('E2E Future Offer');
    });

    it('STRICT: cloudinaryPublicId is NEVER present in any offer object', async () => {
      const response = await request(app.getHttpServer()).get('/offers').expect(200);

      for (const offer of response.body.data) {
        expect(offer).not.toHaveProperty('cloudinaryPublicId');
      }
    });

    it('results are ordered by startDate ascending', async () => {
      // Seed a second active offer that started earlier so order is observable
      const earlier = await prisma.offer.create({
        data: {
          titleAr: 'عرض سابق',
          titleEn: 'E2E Active Offer',
          startDate: new Date(daysFromNow(-3)),
          endDate: new Date(daysFromNow(1)),
        },
      });

      const response = await request(app.getHttpServer()).get('/offers').expect(200);

      const dates: string[] = response.body.data.map((o: any) => o.startDate);
      const sorted = [...dates].sort();
      expect(dates).toEqual(sorted);

      // Cleanup the extra row
      await prisma.offer.delete({ where: { id: earlier.id } });
    });
  });

  // ===========================================================================
  // 2. GET /offers/banner — Public Banner Offers
  // ===========================================================================

  describe('GET /offers/banner (public)', () => {
    let bannerOfferId: string;

    beforeAll(async () => {
      const banner = await seedOffer({
        titleEn: 'E2E Banner Offer',
        startDate: ACTIVE_START,
        endDate: ACTIVE_END,
        showInTopBanner: true,
      });
      bannerOfferId = banner.id;
    });

    it('returns HTTP 200', async () => {
      await request(app.getHttpServer()).get('/offers/banner').expect(200);
    });

    it('includes only offers where showInTopBanner is true', async () => {
      const response = await request(app.getHttpServer()).get('/offers/banner').expect(200);

      for (const offer of response.body.data) {
        expect(offer.showInTopBanner).toBe(true);
      }

      const ids: string[] = response.body.data.map((o: any) => o.id);
      expect(ids).toContain(bannerOfferId);
    });

    it('does not include non-banner active offers in banner response', async () => {
      const response = await request(app.getHttpServer()).get('/offers/banner').expect(200);
      const titles: string[] = response.body.data.map((o: any) => o.titleEn);
      expect(titles).not.toContain('E2E Active Offer');
    });

    it('STRICT: cloudinaryPublicId is NEVER present in any banner offer', async () => {
      const response = await request(app.getHttpServer()).get('/offers/banner').expect(200);

      for (const offer of response.body.data) {
        expect(offer).not.toHaveProperty('cloudinaryPublicId');
      }
    });
  });

  // ===========================================================================
  // 3. GET /admin/offers — Admin All Offers
  // ===========================================================================

  describe('GET /admin/offers (admin)', () => {
    it('returns 401 when no JWT is provided (guard not bypassed in this sub-suite)', async () => {
      // Build a fresh app WITHOUT overriding the guard to test the real 401 behavior
      const isolated = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(CloudinaryService)
        .useValue({ uploadFile: jest.fn(), deleteFile: jest.fn() })
        .compile();

      const isolatedApp = isolated.createNestApplication();
      isolatedApp.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
      );
      await isolatedApp.init();

      await request(isolatedApp.getHttpServer()).get('/admin/offers').expect(401);
      await isolatedApp.close();
    });

    it('returns HTTP 200 with all offers (including past/future), ordered by startDate DESC', async () => {
      const response = await request(app.getHttpServer()).get('/admin/offers').expect(200);

      expect(response.body.message).toBe('Offers retrieved successfully');
      expect(Array.isArray(response.body.data)).toBe(true);

      const titles: string[] = response.body.data.map((o: any) => o.titleEn);
      expect(titles).toContain('E2E Past Offer');
      expect(titles).toContain('E2E Future Offer');
      expect(titles).toContain('E2E Active Offer');
    });

    it('includes cloudinaryPublicId in the admin response', async () => {
      // Seed an offer with a known cloudinaryPublicId
      const offer = await seedOffer({
        titleEn: 'E2E Offer With Image',
        startDate: ACTIVE_START,
        endDate: ACTIVE_END,
        imageUrl: 'https://example.com/offer.jpg',
        cloudinaryPublicId: 'bionl/offers/admin-test-id',
      });

      const response = await request(app.getHttpServer()).get('/admin/offers').expect(200);

      const found = response.body.data.find((o: any) => o.id === offer.id);
      expect(found).toBeDefined();
      expect(found.cloudinaryPublicId).toBe('bionl/offers/admin-test-id');

      await prisma.offer.delete({ where: { id: offer.id } });
    });

    it('results are ordered by startDate descending', async () => {
      const response = await request(app.getHttpServer()).get('/admin/offers').expect(200);

      const dates: string[] = response.body.data.map((o: any) => o.startDate);
      const sortedDesc = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      expect(dates).toEqual(sortedDesc);
    });
  });

  // ===========================================================================
  // 4. POST /admin/offers — Create Offer
  // ===========================================================================

  describe('POST /admin/offers (admin)', () => {
    it('401 - returns 401 when no JWT is provided', async () => {
      const isolated = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(CloudinaryService)
        .useValue({ uploadFile: jest.fn(), deleteFile: jest.fn() })
        .compile();

      const isolatedApp = isolated.createNestApplication();
      isolatedApp.useGlobalPipes(
        new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
      );
      await isolatedApp.init();

      await request(isolatedApp.getHttpServer())
        .post('/admin/offers')
        .field('titleAr', 'عرض')
        .field('titleEn', 'E2E Auth Test Offer')
        .field('startDate', ACTIVE_START)
        .field('endDate', ACTIVE_END)
        .expect(401);

      await isolatedApp.close();
    });

    it('400 - returns 400 when endDate is before startDate', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/offers')
        .field('titleAr', 'عرض تجريبي')
        .field('titleEn', 'E2E Bad Date Offer')
        .field('startDate', ACTIVE_END)   // end used as start
        .field('endDate', ACTIVE_START)   // start used as end → invalid
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/endDate must be strictly after startDate/i),
        ]),
      );
    });

    it('400 - returns 400 when endDate equals startDate', async () => {
      const same = new Date().toISOString();
      await request(app.getHttpServer())
        .post('/admin/offers')
        .field('titleAr', 'عرض')
        .field('titleEn', 'E2E Same Date Offer')
        .field('startDate', same)
        .field('endDate', same)
        .expect(400);
    });

    it('400 - returns 400 when required fields are missing (no titleAr)', async () => {
      await request(app.getHttpServer())
        .post('/admin/offers')
        .field('titleEn', 'E2E Missing Field Offer')
        .field('startDate', ACTIVE_START)
        .field('endDate', ACTIVE_END)
        .expect(400);
    });

    it('400 - returns 400 when an invalid file MIME type is uploaded', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');

      const response = await request(app.getHttpServer())
        .post('/admin/offers')
        .field('titleAr', 'عرض')
        .field('titleEn', 'E2E Invalid MIME Offer')
        .field('startDate', ACTIVE_START)
        .field('endDate', ACTIVE_END)
        .attach('image', pdfBuffer, { filename: 'file.pdf', contentType: 'application/pdf' })
        .expect(400);

      expect(response.body.message).toMatch(/invalid file type/i);
    });

    it('201 - creates an offer WITHOUT an image (imageUrl and cloudinaryPublicId are null)', async () => {
      const response = await request(app.getHttpServer())
        .post('/admin/offers')
        .field('titleAr', 'عرض بدون صورة')
        .field('titleEn', 'E2E Offer No Image')
        .field('startDate', ACTIVE_START)
        .field('endDate', ACTIVE_END)
        .field('showInTopBanner', 'false')
        .expect(201);

      expect(response.body.message).toBe('Offer created successfully');
      const created = response.body.data;
      expect(created.titleEn).toBe('E2E Offer No Image');
      expect(created.imageUrl).toBeNull();
      expect(created.cloudinaryPublicId).toBeNull();

      // Verify Cloudinary was NOT called
      expect(mockUploadFile).not.toHaveBeenCalled();

      // Verify DB record
      const dbOffer = await prisma.offer.findUnique({ where: { id: created.id } });
      expect(dbOffer).not.toBeNull();
      expect(dbOffer?.imageUrl).toBeNull();
      expect(dbOffer?.cloudinaryPublicId).toBeNull();
    });

    it('201 - creates an offer WITH an image, uploads to Cloudinary, stores imageUrl and cloudinaryPublicId', async () => {
      // Reset call counts from prior tests
      mockUploadFile.mockClear();

      const response = await request(app.getHttpServer())
        .post('/admin/offers')
        .field('titleAr', 'عرض مع صورة')
        .field('titleEn', 'E2E Offer With Image')
        .field('startDate', ACTIVE_START)
        .field('endDate', ACTIVE_END)
        .field('showInTopBanner', 'true')
        .attach('image', dummyImageBuffer, { filename: 'offer.jpg', contentType: 'image/jpeg' })
        .expect(201);

      expect(response.body.message).toBe('Offer created successfully');
      const created = response.body.data;

      offerWithImageId = created.id;

      // Assert Cloudinary upload was called with the correct folder
      expect(mockUploadFile).toHaveBeenCalledTimes(1);
      expect(mockUploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        'bionl/offers',
      );

      // Assert response reflects the mocked upload result
      expect(created.imageUrl).toBe(MOCK_UPLOAD_RESULT.url);
      expect(created.cloudinaryPublicId).toBe(MOCK_UPLOAD_RESULT.publicId);
      expect(created.showInTopBanner).toBe(true);

      // Assert DB record is persisted correctly
      const dbOffer = await prisma.offer.findUnique({ where: { id: created.id } });
      expect(dbOffer).not.toBeNull();
      expect(dbOffer?.imageUrl).toBe(MOCK_UPLOAD_RESULT.url);
      expect(dbOffer?.cloudinaryPublicId).toBe(MOCK_UPLOAD_RESULT.publicId);
      expect(dbOffer?.showInTopBanner).toBe(true);
    });
  });

  // ===========================================================================
  // 5. PATCH /admin/offers/:id — Update Offer
  // ===========================================================================

  describe('PATCH /admin/offers/:id (admin)', () => {
    let targetId: string;

    beforeAll(async () => {
      // Seed a dedicated offer for update tests
      const offer = await seedOffer({
        titleEn: 'E2E Offer For Update',
        startDate: ACTIVE_START,
        endDate: ACTIVE_END,
        imageUrl: MOCK_UPLOAD_RESULT.url,
        cloudinaryPublicId: MOCK_UPLOAD_RESULT.publicId,
      });
      targetId = offer.id;
    });

    it('400 - returns 400 when endDate is before startDate in update payload', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/offers/${targetId}`)
        .field('startDate', ACTIVE_END)
        .field('endDate', ACTIVE_START)
        .expect(400);

      expect(response.body.message).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/endDate must be strictly after startDate/i),
        ]),
      );
    });

    it('404 - returns 404 when offer does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .patch(`/admin/offers/${fakeId}`)
        .field('titleEn', 'Does Not Matter')
        .expect(404);
    });

    it('200 - updates text fields without touching the image', async () => {
      mockUploadFile.mockClear();
      mockDeleteFile.mockClear();

      const response = await request(app.getHttpServer())
        .patch(`/admin/offers/${targetId}`)
        .field('titleEn', 'E2E Offer For Update — Edited Title')
        .expect(200);

      expect(response.body.message).toBe('Offer updated successfully');
      expect(response.body.data.titleEn).toBe('E2E Offer For Update — Edited Title');

      // Cloudinary must NOT have been touched
      expect(mockUploadFile).not.toHaveBeenCalled();
      expect(mockDeleteFile).not.toHaveBeenCalled();

      // Image fields must remain unchanged
      expect(response.body.data.imageUrl).toBe(MOCK_UPLOAD_RESULT.url);
      expect(response.body.data.cloudinaryPublicId).toBe(MOCK_UPLOAD_RESULT.publicId);
    });

    it('200 - replaces the image: uploads new, deletes old from Cloudinary, updates DB', async () => {
      mockUploadFile.mockClear().mockResolvedValueOnce(MOCK_UPLOAD_RESULT_2);
      mockDeleteFile.mockClear();

      const response = await request(app.getHttpServer())
        .patch(`/admin/offers/${targetId}`)
        .attach('image', dummyImageBuffer, { filename: 'new-offer.jpg', contentType: 'image/jpeg' })
        .expect(200);

      expect(response.body.message).toBe('Offer updated successfully');

      // New image data must be reflected in response
      expect(response.body.data.imageUrl).toBe(MOCK_UPLOAD_RESULT_2.url);
      expect(response.body.data.cloudinaryPublicId).toBe(MOCK_UPLOAD_RESULT_2.publicId);

      // Old image must have been deleted from Cloudinary
      expect(mockDeleteFile).toHaveBeenCalledTimes(1);
      expect(mockDeleteFile).toHaveBeenCalledWith(MOCK_UPLOAD_RESULT.publicId);

      // DB must reflect new values
      const dbOffer = await prisma.offer.findUnique({ where: { id: targetId } });
      expect(dbOffer?.imageUrl).toBe(MOCK_UPLOAD_RESULT_2.url);
      expect(dbOffer?.cloudinaryPublicId).toBe(MOCK_UPLOAD_RESULT_2.publicId);
    });

    it('EDGE CASE: updating an offer that has NO image does NOT call Cloudinary deleteFile', async () => {
      // Seed an offer with no image
      const noImageOffer = await prisma.offer.create({
        data: {
          titleAr: 'عرض',
          titleEn: 'E2E Offer No Image',
          startDate: new Date(ACTIVE_START),
          endDate: new Date(ACTIVE_END),
          imageUrl: null,
          cloudinaryPublicId: null,
        },
      });

      mockUploadFile.mockClear().mockResolvedValueOnce(MOCK_UPLOAD_RESULT);
      mockDeleteFile.mockClear();

      await request(app.getHttpServer())
        .patch(`/admin/offers/${noImageOffer.id}`)
        .attach('image', dummyImageBuffer, { filename: 'new.jpg', contentType: 'image/jpeg' })
        .expect(200);

      // A new image was uploaded, but NO deletion should happen (no old publicId)
      expect(mockUploadFile).toHaveBeenCalledTimes(1);
      expect(mockDeleteFile).not.toHaveBeenCalled();

      await prisma.offer.delete({ where: { id: noImageOffer.id } });
    });
  });

  // ===========================================================================
  // 6. DELETE /admin/offers/:id — Delete Offer
  // ===========================================================================

  describe('DELETE /admin/offers/:id (admin)', () => {
    it('401 - returns 401 when no JWT is provided', async () => {
      const isolated = await Test.createTestingModule({ imports: [AppModule] })
        .overrideProvider(CloudinaryService)
        .useValue({ uploadFile: jest.fn(), deleteFile: jest.fn() })
        .compile();

      const isolatedApp = isolated.createNestApplication();
      await isolatedApp.init();

      const fakeId = '00000000-0000-0000-0000-000000000001';
      await request(isolatedApp.getHttpServer())
        .delete(`/admin/offers/${fakeId}`)
        .expect(401);

      await isolatedApp.close();
    });

    it('404 - returns 404 when offer does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .delete(`/admin/offers/${fakeId}`)
        .expect(404);
    });

    it('200 - deletes an offer WITH an image, calls Cloudinary deleteFile first', async () => {
      // Seed an offer with a known cloudinaryPublicId
      const offer = await seedOffer({
        titleEn: 'E2E Offer For Delete',
        startDate: ACTIVE_START,
        endDate: ACTIVE_END,
        imageUrl: MOCK_UPLOAD_RESULT.url,
        cloudinaryPublicId: MOCK_UPLOAD_RESULT.publicId,
      });

      mockDeleteFile.mockClear();

      const response = await request(app.getHttpServer())
        .delete(`/admin/offers/${offer.id}`)
        .expect(200);

      expect(response.body.message).toBe('Offer deleted successfully');
      expect(response.body.data).toBeNull();

      // Cloudinary deleteFile must have been called with the offer's publicId
      expect(mockDeleteFile).toHaveBeenCalledTimes(1);
      expect(mockDeleteFile).toHaveBeenCalledWith(MOCK_UPLOAD_RESULT.publicId);

      // DB record must be gone
      const dbOffer = await prisma.offer.findUnique({ where: { id: offer.id } });
      expect(dbOffer).toBeNull();
    });

    it('200 - deletes an offer WITHOUT an image, does NOT call Cloudinary deleteFile', async () => {
      const offer = await prisma.offer.create({
        data: {
          titleAr: 'عرض للحذف',
          titleEn: 'E2E Offer For Delete',
          startDate: new Date(ACTIVE_START),
          endDate: new Date(ACTIVE_END),
          imageUrl: null,
          cloudinaryPublicId: null,
        },
      });

      mockDeleteFile.mockClear();

      await request(app.getHttpServer())
        .delete(`/admin/offers/${offer.id}`)
        .expect(200);

      // No image → no Cloudinary call
      expect(mockDeleteFile).not.toHaveBeenCalled();

      // DB record must be gone
      const dbOffer = await prisma.offer.findUnique({ where: { id: offer.id } });
      expect(dbOffer).toBeNull();
    });
  });

  // ===========================================================================
  // 7. Cross-cutting: active offer seeded by POST test must appear in GET /offers
  // ===========================================================================

  describe('Cross-cutting: POST-then-GET consistency', () => {
    it('an offer created via POST /admin/offers is immediately visible in GET /offers when active', async () => {
      // The 'E2E Offer With Image' offer was created in the POST suite with
      // ACTIVE_START and ACTIVE_END — it should be present in the public list.
      if (!offerWithImageId) {
        // If the POST test was skipped or failed, skip this test gracefully.
        console.warn('offerWithImageId not set — skipping cross-cutting test');
        return;
      }

      const response = await request(app.getHttpServer()).get('/offers').expect(200);

      const ids: string[] = response.body.data.map((o: any) => o.id);
      expect(ids).toContain(offerWithImageId);

      // Even in the cross-cutting test, cloudinaryPublicId must be absent
      const found = response.body.data.find((o: any) => o.id === offerWithImageId);
      expect(found).not.toHaveProperty('cloudinaryPublicId');
    });
  });
});
