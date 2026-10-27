import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { CatalogPreviewService } from '../../features/brand/catalog-preview';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private preview = inject(CatalogPreviewService);
  private baseUrl = 'http://localhost:3000/api'; // Replace with environment var in real app

  get<T>(
    endpoint: string,
    params?:
      | HttpParams
      | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> },
  ): Observable<T> {
    const sample = this.preview.response(endpoint);
    if (sample !== undefined) return of(sample as T);
    if (this.preview.enabled && endpoint.startsWith('/products/'))
      return throwError(() => ({ status: 404, error: { message: 'Product not found' } }));
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, { params, withCredentials: true });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    if (endpoint === '/orders' && body instanceof FormData) {
      const items = String(body.get('items') ?? '');
      if (items.includes('demo-'))
        return throwError(() => ({
          status: 400,
          error: {
            message: 'منتجات العرض التجريبي غير متاحة للطلب. Demo products cannot be ordered.',
          },
        }));
    }
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, { withCredentials: true });
  }

  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body, { withCredentials: true });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, { withCredentials: true });
  }
}
