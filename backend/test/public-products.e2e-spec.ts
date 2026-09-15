import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// ---------------------------------------------------------------------------
// Slugs that this suite owns — used for scoped setup and teardown
// ---------------------------------------------------------------------------

const OWNED_SLUGS = ['bio-derma-cream', 'bio-face-wash', 'omega-3'];
const OWNED_CATEGORY_SLUGS = ['derma', 'supplements'];

jest.setTimeout(30000);

describe('Public Products (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Remove only the rows owned by this suite (slug-scoped) so we don't
    // disturb products created by other suites running in --runInBand order.
    await cleanupOwnedData(prisma);

    // Seed three deterministic products
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
          create: [
            {
              imageUrl: 'http://example.com/gal1.jpg',
              cloudinaryPublicId: 'secret-gal-1',
              displayOrder: 1,
            },
          ],
        },
      },
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
        categories: { create: [{ categoryId: catDerma.id }] },
      },
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
        categories: { create: [{ categoryId: catSupplements.id }] },
      },
    });
  });

  afterAll(async () => {
    await cleanupOwnedData(prisma);
    await app.close();
  });

  // ── Helpers ──────────────────────────────────────────────────────────────────

  /**
   * Deletes only the products and categories seeded by this suite.
   * Does not touch data created by other test suites.
   */
  async function cleanupOwnedData(p: PrismaService) {
    await p.product.deleteMany({ where: { slug: { in: OWNED_SLUGS } } });
    await p.category.deleteMany({ where: { slug: { in: OWNED_CATEGORY_SLUGS } } });
  }

  // ── Tests ─────────────────────────────────────────────────────────────────────

  it('GET /products — retrieves all products and strips sensitive data', async () => {
    const response = await request(app.getHttpServer()).get('/products').expect(200);

    expect(response.body.message).toBe('Products retrieved successfully');

    const data: any[] = response.body.data;

    // The three seeded products must all be present (other suites may add more)
    const slugs = data.map((p: any) => p.slug);
    expect(slugs).toEqual(expect.arrayContaining(OWNED_SLUGS));
    expect(response.body.meta.total).toBeGreaterThanOrEqual(3);

    // Sensitive fields must be stripped from every product
    for (const product of data) {
      expect(product.coverImagePublicId).toBeUndefined();
      if (product.images && product.images.length > 0) {
        expect(product.images[0].cloudinaryPublicId).toBeUndefined();
      }
    }
  });

  it('GET /products?category=derma — filters to the two derma products', async () => {
    const response = await request(app.getHttpServer())
      .get('/products?category=derma')
      .expect(200);

    const slugs = response.body.data.map((p: any) => p.slug);
    // Both derma products must be present; omega-3 must not appear
    expect(slugs).toContain('bio-derma-cream');
    expect(slugs).toContain('bio-face-wash');
    expect(slugs).not.toContain('omega-3');
    // The count must include at least our two seeded derma products
    expect(response.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('GET /products?search=bio — case-insensitive search on nameEn/nameAr', async () => {
    const response = await request(app.getHttpServer())
      .get('/products?search=bio')
      .expect(200);

    const slugs = response.body.data.map((p: any) => p.slug);
    expect(slugs).toContain('bio-derma-cream');
    expect(slugs).toContain('bio-face-wash');
    // Every returned product must match "bio" in at least one name field
    for (const p of response.body.data) {
      const matchesBio =
        p.nameEn?.toLowerCase().includes('bio') ||
        p.nameAr?.toLowerCase().includes('bio');
      expect(matchesBio).toBe(true);
    }
  });

  it('GET /products?minPrice=100&maxPrice=200 — filters by price range', async () => {
    const response = await request(app.getHttpServer())
      .get('/products?minPrice=100&maxPrice=200')
      .expect(200);

    const slugs = response.body.data.map((p: any) => p.slug);
    // bio-derma-cream (150 EGP) must be present; omega-3 (50) must not
    expect(slugs).toContain('bio-derma-cream');
    expect(slugs).not.toContain('omega-3');
    // bio-face-wash (250) must not be present either
    expect(slugs).not.toContain('bio-face-wash');
  });

  it('GET /products/:slug — returns single product with related products and stripped fields', async () => {
    const response = await request(app.getHttpServer())
      .get('/products/bio-derma-cream')
      .expect(200);

    const product = response.body.data;
    expect(product.slug).toBe('bio-derma-cream');
    expect(product.coverImagePublicId).toBeUndefined();

    // Gallery image cloudinaryPublicId must also be stripped
    expect(product.images[0].cloudinaryPublicId).toBeUndefined();

    // bio-face-wash shares the 'derma' category → must appear in relatedProducts
    expect(product.relatedProducts).toBeDefined();
    const relatedSlugs = product.relatedProducts.map((p: any) => p.slug);
    expect(relatedSlugs).toContain('bio-face-wash');

    // Related products must expose only the lightweight fields
    expect(product.relatedProducts[0].descriptionEn).toBeUndefined();
  });

  it('GET /products/:slug — unknown slug returns 404', async () => {
    await request(app.getHttpServer()).get('/products/unknown-slug').expect(404);
  });
});
