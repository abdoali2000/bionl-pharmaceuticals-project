import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Public Products (e2e)', () => {
  jest.setTimeout(30000); // Increase timeout for NestJS boot and Neon DB connection
  
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);
    
    // Clean up before starting
    await prisma.productCategory.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();

    // Seed data
    const catDerma = await prisma.category.create({
      data: { nameAr: 'ديرما', nameEn: 'Derma', slug: 'derma' },
    });
    const catSupplements = await prisma.category.create({
      data: { nameAr: 'مكملات', nameEn: 'Supplements', slug: 'supplements' },
    });

    await prisma.product.create({
      data: {
        nameAr: 'كريم بيو ديرما',
        descriptionAr: 'وصف',
        nameEn: 'Bio Derma Cream',
        descriptionEn: 'desc',
        slug: 'bio-derma-cream',
        price: '150',
        coverImageUrl: 'http://example.com/bio-derma.jpg',
        coverImagePublicId: 'secret-id-derma',
        categories: { create: [{ categoryId: catDerma.id }] },
        images: {
          create: [{ imageUrl: 'http://example.com/gal1.jpg', cloudinaryPublicId: 'secret-gal-1', displayOrder: 1 }]
        }
      }
    });

    await prisma.product.create({
      data: {
        nameAr: 'غسول بيو للوجه',
        descriptionAr: 'وصف',
        nameEn: 'Bio Face Wash',
        descriptionEn: 'desc',
        slug: 'bio-face-wash',
        price: '250',
        coverImageUrl: 'http://example.com/bio-wash.jpg',
        coverImagePublicId: 'secret-id-wash',
        categories: { create: [{ categoryId: catDerma.id }] }
      }
    });

    await prisma.product.create({
      data: {
        nameAr: 'أوميجا 3',
        descriptionAr: 'وصف',
        nameEn: 'Omega 3',
        descriptionEn: 'desc',
        slug: 'omega-3',
        price: '50',
        coverImageUrl: 'http://example.com/omega.jpg',
        coverImagePublicId: 'secret-id-omega',
        categories: { create: [{ categoryId: catSupplements.id }] }
      }
    });
  });

  afterAll(async () => {
    // Clean up
    await prisma.productCategory.deleteMany();
    await prisma.productImage.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await app.close();
  });

  it('/api/products (GET) - Retrieve all products and strip sensitive data', async () => {
    const response = await request(app.getHttpServer())
      .get('/products')
      .expect(200);

    expect(response.body.message).toBe('Products retrieved successfully');
    expect(response.body.data.length).toBe(3);
    expect(response.body.meta.total).toBe(3);

    // Verify sensitive data is stripped
    const products = response.body.data;
    for (const product of products) {
      expect(product.coverImagePublicId).toBeUndefined();
      if (product.images && product.images.length > 0) {
        expect(product.images[0].cloudinaryPublicId).toBeUndefined();
      }
    }
  });

  it('/api/products (GET) - Filter by category', async () => {
    const response = await request(app.getHttpServer())
      .get('/products?category=derma')
      .expect(200);

    expect(response.body.data.length).toBe(2);
    expect(response.body.meta.total).toBe(2);
    expect(response.body.data.some((p: any) => p.slug === 'bio-derma-cream')).toBe(true);
    expect(response.body.data.some((p: any) => p.slug === 'bio-face-wash')).toBe(true);
  });

  it('/api/products (GET) - Filter by search (case-insensitive on nameEn/nameAr)', async () => {
    const response = await request(app.getHttpServer())
      .get('/products?search=bio')
      .expect(200);

    expect(response.body.data.length).toBe(2);
    expect(response.body.data.some((p: any) => p.nameEn.toLowerCase().includes('bio'))).toBe(true);
  });

  it('/api/products (GET) - Filter by minPrice and maxPrice', async () => {
    const response = await request(app.getHttpServer())
      .get('/products?minPrice=100&maxPrice=200')
      .expect(200);

    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].slug).toBe('bio-derma-cream'); // price is 150
  });

  it('/api/products/:slug (GET) - Retrieve single product and related products', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/bio-derma-cream')
      .expect(200);

    const product = response.body.data;
    expect(product.slug).toBe('bio-derma-cream');
    expect(product.coverImagePublicId).toBeUndefined(); // Sensitive data stripped

    // Check related products
    expect(product.relatedProducts).toBeDefined();
    expect(product.relatedProducts.length).toBe(1);
    expect(product.relatedProducts[0].slug).toBe('bio-face-wash'); // Shares 'derma' category
    // Related products should only return specific fields (id, slug, nameAr, nameEn, price, coverImageUrl)
    expect(product.relatedProducts[0].descriptionEn).toBeUndefined();
  });

  it('/api/products/:slug (GET) - Unknown slug returns 404', async () => {
    await request(app.getHttpServer())
      .get('/products/unknown-slug')
      .expect(404);
  });
});
