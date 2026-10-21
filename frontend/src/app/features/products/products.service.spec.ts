import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProductsService } from './products.service';

describe('ProductsService category query contract', () => {
  let service: ProductsService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductsService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('sends the category slug with the supported search and price parameters', () => {
    const query = { category: 'derma', search: ' cream ', minPrice: 10, maxPrice: 200 };
    service.loadProducts(query).subscribe();

    const request = http.expectOne(req => req.url.endsWith('/products'));
    expect(request.request.method).toBe('GET');
    expect(request.request.params.keys().sort()).toEqual(['category', 'maxPrice', 'minPrice', 'search']);
    expect(request.request.params.get('category')).toBe('derma');
    expect(request.request.params.get('search')).toBe('cream');
    expect(request.request.params.get('minPrice')).toBe('10');
    expect(request.request.params.get('maxPrice')).toBe('200');
    request.flush({ success: true, data: [], meta: { total: 0 } });
  });

  it('omits the category when no category is selected', () => {
    service.loadProducts({ search: 'cream' }).subscribe();

    const request = http.expectOne(req => req.url.endsWith('/products'));
    expect(request.request.params.keys()).toEqual(['search']);
    request.flush({ success: true, data: [], meta: { total: 0 } });
  });
});
