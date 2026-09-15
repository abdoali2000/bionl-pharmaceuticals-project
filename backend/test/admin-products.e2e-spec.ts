import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';

// Increase the global timeout for all tests in this file because NestJS
// application bootstrap + database connection can exceed the default 5 s.
jest.setTimeout(30000);

// ---------------------------------------------------------------------------
// Shared mock values & Helpers
// ---------------------------------------------------------------------------

const MOCK_UPLOAD_RESULT_1 = {
  url: 'https://mock-url.com/image.jpg',
  publicId: 'mock-id-1234',
};

const MOCK_UPLOAD_RESULT_2 = {
  url: 'https://mock-url.com/new-cover.jpg',
  publicId: 'mock-new-cover-id',
};

// A minimal JPEG-shaped buffer that passes multer's memory-storage pipeline.
const dummyImageBuffer = Buffer.from('dummy image data');

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Admin Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mockUploadFile: jest.Mock;
  let mockDeleteFile: jest.Mock;

  // Shared state across tests (order matters — describe blocks run top-to-bottom)
  let productId: string;
  let galleryImageIds: string[] = [];

  beforeAll(async () => {
    // Create stable mock function references so we can configure them per-test.
    mockUploadFile = jest.fn().mockResolvedValue(MOCK_UPLOAD_RESULT_1);
    mockDeleteFile = jest.fn().mockResolvedValue(undefined);

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(CloudinaryService)
      .useValue({ uploadFile: mockUploadFile, deleteFile: mockDeleteFile })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );

    await app.init();
    prisma = app.get<PrismaService>(PrismaService);

    // Remove any stale row from a previous failed run (slug-scoped, safe).
    await prisma.product.deleteMany({ where: { slug: 'test-product' } });
  });

  afterAll(async () => {
    // Primary cleanup: delete by id (set to '' after intentional delete test).
    if (productId) {
      await prisma.product.deleteMany({ where: { id: productId } });
    }
    // Safety net: also clean up by slug in case productId was never set.
    await prisma.product.deleteMany({ where: { slug: 'test-product' } });
    await app.close();
  });

  // ── EP-03-02 — existing product CRUD ──────────────────────────────────────

  it('POST /admin/products — creates a product', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/products')
      .field('nameAr', 'منتج تجريبي')
      .field('descriptionAr', 'وصف تجريبي طويل للمنتج لكي يمر من الـ Validation')
      .field('nameEn', 'Test Product')
      .field('descriptionEn', 'Long enough description for the test to pass validation rules')
      .field('price', '150')
      .attach('coverImage', dummyImageBuffer, {
        filename: 'cover.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    expect(response.body.message).toBe('Product created successfully');
    expect(response.body.data.nameEn).toBe('Test Product');
    expect(response.body.data.price).toBe('150');

    productId = response.body.data.id;

    const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
    expect(dbProduct).toBeDefined();
    expect(dbProduct?.slug).toBe('test-product');
    expect(dbProduct?.coverImageUrl).toBe(MOCK_UPLOAD_RESULT_1.url);
    expect(dbProduct?.coverImagePublicId).toBe(MOCK_UPLOAD_RESULT_1.publicId);
  });

  it('PATCH /admin/products/:id — updates text fields without changing the slug', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/admin/products/${productId}`)
      .send({ nameEn: 'Updated Test Product Name' })
      .expect(200);

    expect(response.body.message).toBe('Product updated successfully');
    expect(response.body.data.nameEn).toBe('Updated Test Product Name');

    const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
    expect(dbProduct?.nameEn).toBe('Updated Test Product Name');
    expect(dbProduct?.slug).toBe('test-product');
  });

  it('GET /admin/products — returns a list that includes the created product', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/products')
      .expect(200);

    expect(response.body.message).toBe('Products retrieved successfully');
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);

    const foundProduct = response.body.data.find((p: any) => p.id === productId);
    expect(foundProduct).toBeDefined();
    expect(foundProduct.nameEn).toBe('Updated Test Product Name');
    expect(foundProduct.coverImagePublicId).toBe(MOCK_UPLOAD_RESULT_1.publicId);
  });

  it('GET /admin/products/:id — returns a single product by UUID', async () => {
    const response = await request(app.getHttpServer())
      .get(`/admin/products/${productId}`)
      .expect(200);

    expect(response.body.message).toBe('Product retrieved successfully');
    expect(response.body.data.id).toBe(productId);
    expect(response.body.data.nameEn).toBe('Updated Test Product Name');
    expect(response.body.data.coverImagePublicId).toBe(MOCK_UPLOAD_RESULT_1.publicId);
  });

  // ── EP-03-04: Replace Cover Image ─────────────────────────────────────────

  describe('PATCH /admin/products/:id/cover-image (EP-03-04)', () => {
    it('200 - Replaces the cover image, deletes old one from Cloudinary, updates DB', async () => {
      // Arrange: upload returns the new image details
      mockUploadFile.mockResolvedValueOnce(MOCK_UPLOAD_RESULT_2);

      // Act
      const response = await request(app.getHttpServer())
        .patch(`/admin/products/${productId}/cover-image`)
        .attach('coverImage', dummyImageBuffer, 'new-cover.jpg')
        .expect(200);

      // Assert HTTP response shape
      expect(response.body.message).toBe('Cover image replaced successfully');
      expect(response.body.data.coverImageUrl).toBe(MOCK_UPLOAD_RESULT_2.url);
      expect(response.body.data.coverImagePublicId).toBe(MOCK_UPLOAD_RESULT_2.publicId);

      // Assert uploadFile was called with the correct folder
      expect(mockUploadFile).toHaveBeenCalledTimes(1);
      expect(mockUploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        'bionl/products/covers',
      );

      // Assert deleteFile was called to clean up the old Cloudinary asset
      expect(mockDeleteFile).toHaveBeenCalledTimes(1);
      expect(mockDeleteFile).toHaveBeenCalledWith(MOCK_UPLOAD_RESULT_1.publicId);

      // Assert DB was updated with the new values
      const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbProduct?.coverImageUrl).toBe(MOCK_UPLOAD_RESULT_2.url);
      expect(dbProduct?.coverImagePublicId).toBe(MOCK_UPLOAD_RESULT_2.publicId);
    });

    it('400 - Returns 400 when no coverImage file is attached', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/admin/products/${productId}/cover-image`)
        .expect(400);

      expect(response.body.message).toContain('Cover image is required');
    });

    it('400 - Returns 400 when an invalid MIME type is uploaded', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');

      const response = await request(app.getHttpServer())
        .patch(`/admin/products/${productId}/cover-image`)
        .attach('coverImage', pdfBuffer, { filename: 'file.pdf', contentType: 'application/pdf' })
        .expect(400);

      expect(response.body.message).toMatch(/invalid file type/i);
    });

    it('404 - Returns 404 when the product does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .patch(`/admin/products/${fakeId}/cover-image`)
        .attach('coverImage', dummyImageBuffer, 'any.jpg')
        .expect(404);
    });

    it('EDGE CASE: DB is still updated even when deleteFile (old image) rejects', async () => {
      // At this point the DB holds MOCK_UPLOAD_RESULT_2 (from the happy-path test above).
      const MOCK_UPLOAD_RESULT_3 = {
        url: 'https://mock-url.com/cover-after-soft-fail.jpg',
        publicId: 'mock-cover-after-soft-fail',
      };

      // Arrange: upload succeeds but deleteFile throws (simulates Cloudinary API outage)
      mockUploadFile.mockResolvedValueOnce(MOCK_UPLOAD_RESULT_3);
      mockDeleteFile.mockRejectedValueOnce(new Error('Cloudinary network timeout'));

      // Act — the endpoint must NOT return a 5xx; it must succeed
      const response = await request(app.getHttpServer())
        .patch(`/admin/products/${productId}/cover-image`)
        .attach('coverImage', dummyImageBuffer, 'soft-fail-cover.jpg')
        .expect(200);

      // Assert response still contains the new image data
      expect(response.body.message).toBe('Cover image replaced successfully');
      expect(response.body.data.coverImageUrl).toBe(MOCK_UPLOAD_RESULT_3.url);
      expect(response.body.data.coverImagePublicId).toBe(MOCK_UPLOAD_RESULT_3.publicId);

      // Assert DB was updated despite the Cloudinary deletion failure
      const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbProduct?.coverImageUrl).toBe(MOCK_UPLOAD_RESULT_3.url);
      expect(dbProduct?.coverImagePublicId).toBe(MOCK_UPLOAD_RESULT_3.publicId);
    });

    it('500 - Returns 500 when uploadFile (new image) fails', async () => {
      const dbBefore = await prisma.product.findUnique({ where: { id: productId } });

      // Arrange: upload fails outright
      mockUploadFile.mockRejectedValueOnce(new Error('Cloudinary upload failed'));

      await request(app.getHttpServer())
        .patch(`/admin/products/${productId}/cover-image`)
        .attach('coverImage', dummyImageBuffer, 'fail-upload.jpg')
        .expect(500);

      // The DB must remain unchanged
      const dbAfter = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbAfter?.coverImageUrl).toBe(dbBefore?.coverImageUrl);
      expect(dbAfter?.coverImagePublicId).toBe(dbBefore?.coverImagePublicId);
    });
  });

  // ── EP-03-03 — gallery image management ───────────────────────────────────

  describe('POST /admin/products/:id/images — upload gallery images', () => {
    it('returns 400 when no files are attached', async () => {
      await request(app.getHttpServer())
        .post(`/admin/products/${productId}/images`)
        .expect(400);
    });

    it('uploads 3 images and creates ProductImage records with incremental displayOrder', async () => {
      const response = await request(app.getHttpServer())
        .post(`/admin/products/${productId}/images`)
        .attach('images', dummyImageBuffer, { filename: 'img1.jpg', contentType: 'image/jpeg' })
        .attach('images', dummyImageBuffer, { filename: 'img2.jpg', contentType: 'image/jpeg' })
        .attach('images', dummyImageBuffer, { filename: 'img3.jpg', contentType: 'image/jpeg' })
        .expect(201);

      expect(response.body.message).toBe('Gallery images uploaded successfully');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data).toHaveLength(3);

      galleryImageIds = response.body.data.map((img: any) => img.id);

      const orders = response.body.data.map((img: any) => img.displayOrder);
      expect(orders).toEqual([1, 2, 3]);

      const dbImages = await prisma.productImage.findMany({
        where: { productId },
        orderBy: { displayOrder: 'asc' },
      });
      expect(dbImages).toHaveLength(3);
      expect(dbImages.map((i) => i.displayOrder)).toEqual([1, 2, 3]);
    });

    it('returns 400 when more than 10 files are attached', async () => {
      let req = request(app.getHttpServer()).post(`/admin/products/${productId}/images`);
      for (let i = 0; i < 11; i++) {
        req = req.attach('images', dummyImageBuffer, {
          filename: `img${i}.jpg`,
          contentType: 'image/jpeg',
        });
      }
      await req.expect(400);
    });

    it('second upload appends after existing images (displayOrder continues from max)', async () => {
      const response = await request(app.getHttpServer())
        .post(`/admin/products/${productId}/images`)
        .attach('images', dummyImageBuffer, { filename: 'extra.jpg', contentType: 'image/jpeg' })
        .expect(201);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].displayOrder).toBe(4);

      const extraId: string = response.body.data[0].id;
      await prisma.productImage.delete({ where: { id: extraId } });
    });
  });

  describe('PATCH /admin/products/:id/images/reorder — reorder gallery images', () => {
    it('atomically updates displayOrder for all provided images', async () => {
      const payload = {
        images: [
          { id: galleryImageIds[0], displayOrder: 30 },
          { id: galleryImageIds[1], displayOrder: 20 },
          { id: galleryImageIds[2], displayOrder: 10 },
        ],
      };

      const response = await request(app.getHttpServer())
        .patch(`/admin/products/${productId}/images/reorder`)
        .send(payload)
        .expect(200);

      expect(response.body.message).toBe('Gallery images reordered successfully');
      expect(Array.isArray(response.body.data)).toBe(true);

      expect(response.body.data[0].id).toBe(galleryImageIds[2]);
      expect(response.body.data[0].displayOrder).toBe(10);

      const dbImages = await prisma.productImage.findMany({
        where: { productId },
        orderBy: { displayOrder: 'asc' },
      });
      expect(dbImages[0].id).toBe(galleryImageIds[2]);
      expect(dbImages[0].displayOrder).toBe(10);
    });

    it('returns 400 when an image ID does not belong to this product', async () => {
      const fakeImageId = '00000000-0000-0000-0000-000000000000';
      const payload = {
        images: [{ id: fakeImageId, displayOrder: 99 }],
      };

      await request(app.getHttpServer())
        .patch(`/admin/products/${productId}/images/reorder`)
        .send(payload)
        .expect(400);
    });

    it('returns 400 when displayOrder is not a positive integer', async () => {
      const payload = {
        images: [{ id: galleryImageIds[0], displayOrder: -5 }],
      };

      await request(app.getHttpServer())
        .patch(`/admin/products/${productId}/images/reorder`)
        .send(payload)
        .expect(400);
    });
  });

  describe('DELETE /admin/products/:id/images/:imageId — delete a gallery image', () => {
    it('returns 400 when the image does not belong to this product', async () => {
      const foreignImageId = '00000000-0000-0000-0000-000000000001';

      await request(app.getHttpServer())
        .delete(`/admin/products/${productId}/images/${foreignImageId}`)
        .expect(400);
    });

    it('deletes a gallery image and removes it from the DB and Cloudinary', async () => {
      const targetId = galleryImageIds[0];

      const dbImageBefore = await prisma.productImage.findUnique({
        where: { id: targetId },
      });
      expect(dbImageBefore).not.toBeNull();

      const response = await request(app.getHttpServer())
        .delete(`/admin/products/${productId}/images/${targetId}`)
        .expect(200);

      expect(response.body.message).toBe('Gallery image deleted successfully');

      const dbImageAfter = await prisma.productImage.findUnique({
        where: { id: targetId },
      });
      expect(dbImageAfter).toBeNull();

      expect(mockDeleteFile).toHaveBeenCalledWith(
        dbImageBefore!.cloudinaryPublicId,
      );

      galleryImageIds = galleryImageIds.filter((id) => id !== targetId);
    });
  });

  // ── EP-03-02 — delete (must come last; cleans up the whole product) ────────

  it('DELETE /admin/products/:id — deletes the product and all related records', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/admin/products/${productId}`)
      .expect(200);

    expect(response.body.message).toBe('Product deleted successfully');

    const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
    expect(dbProduct).toBeNull();

    const remaining = await prisma.productImage.findMany({ where: { productId } });
    expect(remaining).toHaveLength(0);

    productId = ''; // prevent double-delete in afterAll
  });
});