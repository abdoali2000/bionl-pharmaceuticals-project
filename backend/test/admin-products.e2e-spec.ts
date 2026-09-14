import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** A minimal JPEG-shaped buffer that passes multer's memory-storage pipeline. */
const dummyImageBuffer = Buffer.from('dummy image data');

// Cloudinary mock: each call to uploadFile returns a unique URL and publicId
// so tests can identify individual uploaded images.
let uploadCallCount = 0;
const mockCloudinaryService = {
  uploadFile: jest.fn().mockImplementation(() => {
    uploadCallCount++;
    return Promise.resolve({
      url: `https://mock-cdn.com/image-${uploadCallCount}.jpg`,
      publicId: `mock-public-id-${uploadCallCount}`,
    });
  }),
  deleteFile: jest.fn().mockResolvedValue(undefined),
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

// NestJS startup + real DB connection routinely takes > 5 s in CI.
jest.setTimeout(30000);

describe('Admin Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Shared state across tests (order matters — describe blocks run top-to-bottom)
  let productId: string;
  let galleryImageIds: string[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideProvider(CloudinaryService)
      .useValue(mockCloudinaryService)
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

    productId = response.body.data.id;

    const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
    expect(dbProduct).toBeDefined();
    expect(dbProduct?.slug).toBe('test-product');
    expect(dbProduct?.coverImageUrl).toMatch(/https:\/\/mock-cdn\.com/);
    expect(dbProduct?.coverImagePublicId).toMatch(/mock-public-id/);
  });

  it('PATCH /admin/products/:id — updates text fields without changing the slug', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/admin/products/${productId}`)
      .send({ nameEn: 'Updated Test Product Name' })
      .expect(200);

    expect(response.body.message).toBe('Product updated successfully');
    expect(response.body.data.nameEn).toBe('Updated Test Product Name');

    const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
    expect(dbProduct?.slug).toBe('test-product');
  });

  it('GET /admin/products — returns a list that includes the created product', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/products')
      .expect(200);

    expect(response.body.message).toBe('Products retrieved successfully');
    expect(Array.isArray(response.body.data)).toBe(true);

    const found = response.body.data.find((p: any) => p.id === productId);
    expect(found).toBeDefined();
    expect(found.coverImagePublicId).toMatch(/mock-public-id/);
  });

  it('GET /admin/products/:id — returns a single product by UUID', async () => {
    const response = await request(app.getHttpServer())
      .get(`/admin/products/${productId}`)
      .expect(200);

    expect(response.body.message).toBe('Product retrieved successfully');
    expect(response.body.data.id).toBe(productId);
    expect(response.body.data.coverImagePublicId).toMatch(/mock-public-id/);
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

      // Store IDs for subsequent tests
      galleryImageIds = response.body.data.map((img: any) => img.id);

      // displayOrder must be 1, 2, 3 (no prior images on this product)
      const orders = response.body.data.map((img: any) => img.displayOrder);
      expect(orders).toEqual([1, 2, 3]);

      // Verify all 3 exist in the database
      const dbImages = await prisma.productImage.findMany({
        where: { productId },
        orderBy: { displayOrder: 'asc' },
      });
      expect(dbImages).toHaveLength(3);
      expect(dbImages.map((i) => i.displayOrder)).toEqual([1, 2, 3]);
    });

    it('returns 400 when more than 10 files are attached', async () => {
      // Build a request with 11 files
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
      // First 3 have order 1-3; next must be 4
      expect(response.body.data[0].displayOrder).toBe(4);

      // Clean up the extra image so the reorder test works with 3 known images
      const extraId: string = response.body.data[0].id;
      await prisma.productImage.delete({ where: { id: extraId } });
    });
  });

  describe('PATCH /admin/products/:id/images/reorder — reorder gallery images', () => {
    it('atomically updates displayOrder for all provided images', async () => {
      // Reverse the order: 3 → 1, 2 → 2, 1 → 3
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

      // Response is sorted by displayOrder; first item should be the one with 10
      expect(response.body.data[0].id).toBe(galleryImageIds[2]);
      expect(response.body.data[0].displayOrder).toBe(10);

      // Verify DB state
      const dbImages = await prisma.productImage.findMany({
        where: { productId },
        orderBy: { displayOrder: 'asc' },
      });
      expect(dbImages[0].id).toBe(galleryImageIds[2]);
      expect(dbImages[0].displayOrder).toBe(10);
    });

    it('returns 400 when an image ID does not belong to this product', async () => {
      // Create a second product and grab one of its image IDs (or use a random UUID)
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

      // Capture the publicId from the DB before deletion
      const dbImageBefore = await prisma.productImage.findUnique({
        where: { id: targetId },
      });
      expect(dbImageBefore).not.toBeNull();

      const response = await request(app.getHttpServer())
        .delete(`/admin/products/${productId}/images/${targetId}`)
        .expect(200);

      expect(response.body.message).toBe('Gallery image deleted successfully');

      // Verify it is gone from the DB
      const dbImageAfter = await prisma.productImage.findUnique({
        where: { id: targetId },
      });
      expect(dbImageAfter).toBeNull();

      // Verify Cloudinary deleteFile was called with the correct publicId
      expect(mockCloudinaryService.deleteFile).toHaveBeenCalledWith(
        dbImageBefore!.cloudinaryPublicId,
      );

      // Remove from our tracking array so afterAll cleanup is consistent
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

    // Gallery images should cascade-delete
    const remaining = await prisma.productImage.findMany({ where: { productId } });
    expect(remaining).toHaveLength(0);

    productId = ''; // prevent double-delete in afterAll
  });
});
