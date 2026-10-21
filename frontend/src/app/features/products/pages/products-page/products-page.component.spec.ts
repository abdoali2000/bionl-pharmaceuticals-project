import { Component } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { ProductsPageComponent } from './products-page.component';
import { PublicCategory, PublicProduct } from '../../products.service';

@Component({ standalone: true, template: '' })
class OtherPageComponent {}

const categories: PublicCategory[] = [
  { id: '11111111-1111-4111-8111-111111111111', slug: 'derma', nameAr: 'Derma', nameEn: 'Derma' },
  { id: '22222222-2222-4222-8222-222222222222', slug: 'pedia', nameAr: 'Pedia', nameEn: 'Pedia' },
];

const products: PublicProduct[] = categories.map((category, index) => ({
  id: `product-${index}`,
  slug: `${category.slug}-cream`,
  nameAr: `${category.nameEn} Cream`,
  nameEn: `${category.nameEn} Cream`,
  descriptionAr: 'Product description',
  descriptionEn: 'Product description',
  ingredientsAr: null,
  ingredientsEn: null,
  usageInstructionsAr: null,
  usageInstructionsEn: null,
  price: 100,
  coverImageUrl: '/test-product.png',
  categories: [category],
  images: [],
}));

describe('ProductsPageComponent category filtering', () => {
  let http: HttpTestingController;
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'products', component: ProductsPageComponent },
          { path: 'other', component: OtherPageComponent },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    harness = await RouterTestingHarness.create();
  });

  afterEach(() => http.verify());

  function flushCategories(): void {
    http.expectOne(req => req.url.endsWith('/categories')).flush({
      success: true, data: categories, meta: { total: categories.length },
    });
  }

  function flushProducts(category: string | null): void {
    const request = http.expectOne(req => req.url.endsWith('/products'));
    expect(request.request.params.get('category')).toBe(category);
    expect(request.request.params.has('categoryId')).toBe(false);
    const matching = category ? products.filter(product => product.categories[0].slug === category) : products;
    request.flush({ success: true, data: matching, meta: { total: matching.length } });
    harness.detectChanges();
  }

  function categoryChip(label: string): HTMLButtonElement {
    const chips = Array.from(harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('.category-chips .chip'));
    const chip = chips.find(button => button.textContent?.trim() === label);
    if (!chip) throw new Error(`Category chip not found: ${label}`);
    return chip;
  }

  it('selects a category by slug and displays the filtered response', async () => {
    await harness.navigateByUrl('/products', ProductsPageComponent);
    flushCategories();
    flushProducts(null);

    categoryChip('Derma').click();
    flushProducts('derma');
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(router.parseUrl(router.url).queryParams['category']).toBe('derma');
    expect(categoryChip('Derma').classList.contains('active')).toBe(true);
    expect(harness.routeNativeElement!.querySelectorAll('app-product-card')).toHaveLength(1);
    expect(harness.routeNativeElement!.querySelector('.product-grid')?.textContent).toContain('Derma Cream');
    expect(harness.routeNativeElement!.querySelector('.product-grid')?.textContent).not.toContain('Pedia Cream');
  });

  it('restores the active category and combined filters from a direct URL', async () => {
    await harness.navigateByUrl('/products?category=derma&search=cream&minPrice=10&maxPrice=200', ProductsPageComponent);
    flushCategories();
    const request = http.expectOne(req => req.url.endsWith('/products'));
    expect(request.request.params.get('category')).toBe('derma');
    expect(request.request.params.get('search')).toBe('cream');
    expect(request.request.params.get('minPrice')).toBe('10');
    expect(request.request.params.get('maxPrice')).toBe('200');
    expect(request.request.params.has('categoryId')).toBe(false);
    request.flush({ success: true, data: [products[0]], meta: { total: 1 } });
    harness.detectChanges();

    expect(categoryChip('Derma').classList.contains('active')).toBe(true);
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#product-search-input')!.value).toBe('cream');
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#min-price-input')!.value).toBe('10');
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#max-price-input')!.value).toBe('200');
  });

  it('recreates the selected filter when the saved URL is opened again', async () => {
    await harness.navigateByUrl('/products', ProductsPageComponent);
    flushCategories();
    flushProducts(null);
    categoryChip('Derma').click();
    flushProducts('derma');
    await harness.fixture.whenStable();
    const savedUrl = router.url;

    await harness.navigateByUrl('/other', OtherPageComponent);
    await harness.navigateByUrl(savedUrl, ProductsPageComponent);
    flushCategories();
    flushProducts('derma');

    expect(categoryChip('Derma').classList.contains('active')).toBe(true);
  });

  it('clears the category while keeping search, price, and unrelated URL parameters', async () => {
    await harness.navigateByUrl('/products?category=derma&search=cream&minPrice=10&maxPrice=200&source=home', ProductsPageComponent);
    flushCategories();
    flushProducts('derma');
    const allChip = harness.routeNativeElement!.querySelector<HTMLButtonElement>('.category-chips .chip')!;
    allChip.click();

    const request = http.expectOne(req => req.url.endsWith('/products'));
    expect(request.request.params.keys().sort()).toEqual(['maxPrice', 'minPrice', 'search']);
    expect(request.request.params.get('search')).toBe('cream');
    expect(request.request.params.get('minPrice')).toBe('10');
    expect(request.request.params.get('maxPrice')).toBe('200');
    request.flush({ success: true, data: products, meta: { total: 2 } });
    await harness.fixture.whenStable();
    harness.detectChanges();

    expect(router.parseUrl(router.url).queryParams).toEqual({ search: 'cream', minPrice: '10', maxPrice: '200', source: 'home' });
    expect(allChip.classList.contains('active')).toBe(true);
    expect(harness.routeNativeElement!.querySelectorAll('app-product-card')).toHaveLength(2);
  });

  it('replaces an obsolete categoryId URL parameter when a slug filter is selected', async () => {
    await harness.navigateByUrl(`/products?categoryId=${categories[0].id}`, ProductsPageComponent);
    flushCategories();
    http.expectOne(req => req.url.endsWith('/products')).flush({ success: true, data: products, meta: { total: 2 } });
    harness.detectChanges();

    categoryChip('Pedia').click();
    flushProducts('pedia');
    await harness.fixture.whenStable();

    expect(router.parseUrl(router.url).queryParams).toEqual({ category: 'pedia' });
  });
});
