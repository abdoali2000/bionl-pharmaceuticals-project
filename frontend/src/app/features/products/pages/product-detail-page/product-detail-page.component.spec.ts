import { CatalogPreviewService } from '../../../brand/catalog-preview';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { PublicProduct } from '../../products.service';
import { ProductDetailPageComponent } from './product-detail-page.component';

const category = { id: 'category-id', slug: 'derma', nameAr: 'Derma', nameEn: 'Derma' };

function product(slug: string): PublicProduct {
  return {
    id: slug,
    slug,
    nameAr: slug,
    nameEn: slug,
    descriptionAr: 'Description',
    descriptionEn: 'Description',
    ingredientsAr: null,
    ingredientsEn: null,
    usageInstructionsAr: null,
    usageInstructionsEn: null,
    price: 100,
    coverImageUrl: '/product.png',
    categories: [category],
    images: [],
  };
}

function summary(slug: string) {
  const { id, nameAr, nameEn, price, coverImageUrl } = product(slug);
  return { id, slug, nameAr, nameEn, price, coverImageUrl };
}

describe('ProductDetailPageComponent related products', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: CatalogPreviewService, useValue: { response: () => undefined } },
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([{ path: 'products/:slug', component: ProductDetailPageComponent }]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  it('renders at most four summary cards from the response and excludes the current product', async () => {
    await harness.navigateByUrl('/products/first', ProductDetailPageComponent);
    http
      .expectOne((req) => req.url.endsWith('/products/first'))
      .flush({
        success: true,
        data: {
          ...product('first'),
          relatedProducts: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'].map(summary),
        },
      });
    harness.detectChanges();

    http.expectNone((req) => req.url.endsWith('/products'));
    const cards = harness.routeNativeElement!.querySelectorAll<HTMLAnchorElement>(
      '.related-grid app-product-card a',
    );
    expect(cards).toHaveLength(4);
    expect(Array.from(cards, (card) => card.getAttribute('href'))).toEqual([
      '/products/second',
      '/products/third',
      '/products/fourth',
      '/products/fifth',
    ]);
    expect(cards[0].textContent).toContain('second');
    expect(cards[0].querySelector('img')?.getAttribute('src')).toBe('/product.png');
    expect(harness.routeNativeElement!.querySelector('.card-categories')).toBeNull();
  });

  it('hides related products for a product with no categories and an empty response', async () => {
    const page = await harness.navigateByUrl('/products/first', ProductDetailPageComponent);
    http
      .expectOne((req) => req.url.endsWith('/products/first'))
      .flush({
        success: true,
        data: { ...product('first'), categories: [], relatedProducts: [] },
      });
    harness.detectChanges();

    expect(page.pageState()).toBe('loaded');
    expect(harness.routeNativeElement!.querySelector('.related-section')).toBeNull();
    http.expectNone((req) => req.url.endsWith('/products'));
  });

  it('hides the section when a categorized product has no related matches', async () => {
    await harness.navigateByUrl('/products/first', ProductDetailPageComponent);
    http
      .expectOne((req) => req.url.endsWith('/products/first'))
      .flush({
        success: true,
        data: { ...product('first'), relatedProducts: [] },
      });
    harness.detectChanges();

    expect(harness.routeNativeElement!.querySelector('.related-section')).toBeNull();
    http.expectNone((req) => req.url.endsWith('/products'));
  });

  it('refreshes the product and clears stale related cards when a related link is opened', async () => {
    const page = await harness.navigateByUrl('/products/first', ProductDetailPageComponent);
    http
      .expectOne((req) => req.url.endsWith('/products/first'))
      .flush({
        success: true,
        data: { ...product('first'), relatedProducts: [summary('second')] },
      });
    harness.detectChanges();

    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('.related-grid a')!.click();
    await harness.fixture.whenStable();
    expect(page.pageState()).toBe('loading');
    expect(page.relatedProducts()).toEqual([]);

    http
      .expectOne((req) => req.url.endsWith('/products/second'))
      .flush({
        success: true,
        data: { ...product('second'), relatedProducts: [summary('third')] },
      });
    harness.detectChanges();

    expect(page.product()?.slug).toBe('second');
    expect(page.relatedProducts().map((item) => item.slug)).toEqual(['third']);
    expect(harness.routeNativeElement!.querySelector('.related-grid')?.textContent).toContain(
      'third',
    );
    expect(harness.routeNativeElement!.querySelector('.related-grid')?.textContent).not.toContain(
      'second',
    );
    http.expectNone((req) => req.url.endsWith('/products'));
  });
});
