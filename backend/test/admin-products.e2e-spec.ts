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
// Shared mock values
// ---------------------------------------------------------------------------

const MOCK_UPLOAD_RESULT_1 = {
  url: 'https://mock-url.com/image.jpg',
  publicId: 'mock-id-1234',
};

const MOCK_UPLOAD_RESULT_2 = {
  url: 'https://mock-url.com/new-cover.jpg',
  publicId: 'mock-new-cover-id',
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('Admin Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mockUploadFile: jest.Mock;
  let mockDeleteFile: jest.Mock;
  let productId: string;

  // Reusable dummy file buffer (simulates any image upload)
  const dummyImageBuffer = Buffer.from('dummy image data');

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
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up any product that may still exist after a test failure
    if (productId) {
      await prisma.product.deleteMany({ where: { id: productId } });
    }
    await app.close();
  });

  // Reset mock state between tests so one test's queued `Once` values do not
  // leak into subsequent tests.
  afterEach(() => {
    mockUploadFile.mockReset();
    mockDeleteFile.mockReset();
    // Restore the default resolved values after each reset so tests that do
    // not explicitly configure the mock still get a sane default.
    mockUploadFile.mockResolvedValue(MOCK_UPLOAD_RESULT_1);
    mockDeleteFile.mockResolvedValue(undefined);
  });

  // ── Existing EP-03-02 tests ────────────────────────────────────────────────

  it('/api/admin/products (POST) - Create a product', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/products')
      .field('nameAr', 'منتج تجريبي')
      .field('descriptionAr', 'وصف تجريبي طويل للمنتج لكي يمر من الـ Validation')
      .field('nameEn', 'Test Product')
      .field('descriptionEn', 'Long enough description for the test to pass validation rules')
      .field('price', '150')
      .attach('coverImage', dummyImageBuffer, 'test-image.jpg')
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

  it('/api/admin/products/:id (PATCH) - Update a product without touching slug', async () => {
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

  it('/api/admin/products (GET) - Retrieve all products', async () => {
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

  it('/api/admin/products/:id (GET) - Retrieve a single product', async () => {
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

      // Upload and delete must NOT have been called
      expect(mockUploadFile).not.toHaveBeenCalled();
      expect(mockDeleteFile).not.toHaveBeenCalled();
    });

    it('400 - Returns 400 when an invalid MIME type is uploaded', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4 fake pdf content');

      const response = await request(app.getHttpServer())
        .patch(`/admin/products/${productId}/cover-image`)
        .attach('coverImage', pdfBuffer, { filename: 'file.pdf', contentType: 'application/pdf' })
        .expect(400);

      // Multer fileFilter should have rejected the file before the handler runs
      expect(response.body.message).toMatch(/invalid file type/i);

      expect(mockUploadFile).not.toHaveBeenCalled();
      expect(mockDeleteFile).not.toHaveBeenCalled();
    });

    it('404 - Returns 404 when the product does not exist', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .patch(`/admin/products/${fakeId}/cover-image`)
        .attach('coverImage', dummyImageBuffer, 'any.jpg')
        .expect(404);

      // deleteFile should never be reached if the product doesn't exist
      expect(mockDeleteFile).not.toHaveBeenCalled();
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
      // Capture current DB state to verify it is unchanged after the failure.
      const dbBefore = await prisma.product.findUnique({ where: { id: productId } });

      // Arrange: upload fails outright
      mockUploadFile.mockRejectedValueOnce(new Error('Cloudinary upload failed'));

      await request(app.getHttpServer())
        .patch(`/admin/products/${productId}/cover-image`)
        .attach('coverImage', dummyImageBuffer, 'fail-upload.jpg')
        .expect(500);

      // The old image must NOT be deleted when the upload fails
      expect(mockDeleteFile).not.toHaveBeenCalled();

      // The DB must remain unchanged
      const dbAfter = await prisma.product.findUnique({ where: { id: productId } });
      expect(dbAfter?.coverImageUrl).toBe(dbBefore?.coverImageUrl);
      expect(dbAfter?.coverImagePublicId).toBe(dbBefore?.coverImagePublicId);
    });
  });

  // ── Existing EP-03-02 delete test ─────────────────────────────────────────

  it('/api/admin/products/:id (DELETE) - Delete a product', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/admin/products/${productId}`)
      .expect(200);

    expect(response.body.message).toBe('Product deleted successfully');

    const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
    expect(dbProduct).toBeNull();

    productId = '';
  });
});
