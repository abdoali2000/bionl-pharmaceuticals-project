import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { CloudinaryService } from '../src/cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';

describe('Admin Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let productId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true }) // Mock Auth Guard
      .overrideProvider(CloudinaryService)
      .useValue({
        uploadFile: jest.fn().mockResolvedValue({
          url: 'https://mock-url.com/image.jpg',
          publicId: 'mock-id-1234',
        }),
        deleteFile: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same global validation pipes as the real app if any,
    // though the controller uses dto decorators anyway
    app.useGlobalPipes(new ValidationPipe({ transform: true }));

    await app.init();
    
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up created product
    if (productId) {
      await prisma.product.deleteMany({ where: { id: productId } });
    }
    await app.close();
  });

  it('/api/admin/products (POST) - Create a product', async () => {
    // A dummy buffer representing our cover image
    const dummyImageBuffer = Buffer.from('dummy image data');

    const response = await request(app.getHttpServer())
      .post('/admin/products')
      .field('nameAr', 'منتج تجريبي')
      .field('descriptionAr', 'وصف تجريبي طويل للمنتج لكي يمر من الـ Validation')
      .field('nameEn', 'Test Product')
      .field('descriptionEn', 'Long enough description for the test to pass validation rules')
      .field('price', '150')
      .attach('coverImage', dummyImageBuffer, 'test-image.jpg')
      .expect(201);

    expect(response.body.success).toBeUndefined(); // In standard envelope it's usually `success: true` or omitted, let's just check standard fields. 
    // Actually the response format we wrote is: { message, data, meta }
    expect(response.body.message).toBe('Product created successfully');
    expect(response.body.data.nameEn).toBe('Test Product');
    expect(response.body.data.price).toBe('150'); // The decimal comes back as string from prisma usually

    productId = response.body.data.id;
    
    // Check DB
    const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
    expect(dbProduct).toBeDefined();
    expect(dbProduct?.slug).toBe('test-product'); // Automatically generated
    expect(dbProduct?.coverImageUrl).toBe('https://mock-url.com/image.jpg');
    expect(dbProduct?.coverImagePublicId).toBe('mock-id-1234');
  });

  it('/api/admin/products/:id (PATCH) - Update a product without touching slug', async () => {
    const response = await request(app.getHttpServer())
      .patch(`/admin/products/${productId}`)
      .send({
        nameEn: 'Updated Test Product Name'
      })
      .expect(200);

    expect(response.body.message).toBe('Product updated successfully');
    expect(response.body.data.nameEn).toBe('Updated Test Product Name');

    // Verify slug hasn't changed in DB
    const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
    expect(dbProduct?.nameEn).toBe('Updated Test Product Name');
    expect(dbProduct?.slug).toBe('test-product'); // Must remain the same for SEO!
  });

  it('/api/admin/products (GET) - Retrieve all products', async () => {
    const response = await request(app.getHttpServer())
      .get('/admin/products')
      .expect(200);

    expect(response.body.message).toBe('Products retrieved successfully');
    expect(Array.isArray(response.body.data)).toBe(true);
    // Since we created at least one product above, there should be at least 1 in the list
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    
    const foundProduct = response.body.data.find((p: any) => p.id === productId);
    expect(foundProduct).toBeDefined();
    expect(foundProduct.nameEn).toBe('Updated Test Product Name');
    // Admin list should include cloudinary properties
    expect(foundProduct.coverImagePublicId).toBe('mock-id-1234');
  });

  it('/api/admin/products/:id (GET) - Retrieve a single product', async () => {
    const response = await request(app.getHttpServer())
      .get(`/admin/products/${productId}`)
      .expect(200);

    expect(response.body.message).toBe('Product retrieved successfully');
    expect(response.body.data.id).toBe(productId);
    expect(response.body.data.nameEn).toBe('Updated Test Product Name');
    expect(response.body.data.coverImagePublicId).toBe('mock-id-1234');
  });

  it('/api/admin/products/:id (DELETE) - Delete a product', async () => {
    const response = await request(app.getHttpServer())
      .delete(`/admin/products/${productId}`)
      .expect(200);

    expect(response.body.message).toBe('Product deleted successfully');

    // Verify it is completely removed from the database
    const dbProduct = await prisma.product.findUnique({ where: { id: productId } });
    expect(dbProduct).toBeNull();
    
    // Reset productId so afterAll doesn't try to delete it again
    productId = '';
  });
});
