import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CatalogPreviewService } from './catalog-preview';
import { ApiService } from '../../core/services/api.service';

describe('Design preview boundaries', () => {
  beforeEach(() => TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]}));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it('provides seven unique samples and leaves admin endpoints on the real API', () => {
    const preview=TestBed.inject(CatalogPreviewService);
    const response=preview.response('/products') as {data:{id:string}[]};
    expect(response.data.length).toBe(7);
    expect(new Set(response.data.map(p=>p.id)).size).toBe(7);
    expect(preview.response('/admin/products')).toBeUndefined();
    expect(preview.response('/admin/orders')).toBeUndefined();
    expect(preview.response('/categories')).toBeUndefined();
  });
  it('rejects sample order submissions without a network request', () => {
    const body=new FormData();body.append('items',JSON.stringify([{productId:'demo-1',quantity:1}]));
    let status:number|undefined;
    TestBed.inject(ApiService).post('/orders',body).subscribe({error:e=>status=e.status});
    expect(status).toBe(400);
    TestBed.inject(HttpTestingController).expectNone(req=>req.url.endsWith('/orders'));
  });
  it('does not simulate success for contact messages', () => {
    TestBed.inject(ApiService).post('/contact',{fullName:'Preview test'}).subscribe();
    TestBed.inject(HttpTestingController).expectOne(req=>req.url.endsWith('/contact')).flush({success:true,data:null});
  });
});
