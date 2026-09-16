import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../core/services/api.service';

// ── Public models ──────────────────────────────────────────────────────────────

export interface PublicCategory {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
}

export interface PublicProductImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export interface PublicProduct {
  id: string;
  slug: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  ingredientsAr: string | null;
  ingredientsEn: string | null;
  usageInstructionsAr: string | null;
  usageInstructionsEn: string | null;
  price: number;
  coverImageUrl: string;
  categories: PublicCategory[];
  images: PublicProductImage[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: { total?: number } | null;
}

export interface ProductsQuery {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private api = inject(ApiService);

  readonly products = signal<PublicProduct[]>([]);
  readonly categories = signal<PublicCategory[]>([]);
  readonly total = signal<number>(0);
  readonly loadingProducts = signal(false);
  readonly loadingCategories = signal(false);

  /** GET /categories — public, used to populate the filter chip list. */
  loadCategories(): Observable<ApiResponse<PublicCategory[]>> {
    this.loadingCategories.set(true);
    return this.api.get<ApiResponse<PublicCategory[]>>('/categories').pipe(
      tap({
        next: res => {
          this.categories.set(res.data ?? []);
          this.loadingCategories.set(false);
        },
        error: () => this.loadingCategories.set(false)
      })
    );
  }

  /** GET /products — accepts optional search / category / price filters. */
  loadProducts(query: ProductsQuery = {}): Observable<ApiResponse<PublicProduct[]>> {
    this.loadingProducts.set(true);

    let params = new HttpParams();
    if (query.search?.trim())            params = params.set('search', query.search.trim());
    if (query.categoryId)                params = params.set('categoryId', query.categoryId);
    if (query.minPrice != null)          params = params.set('minPrice', String(query.minPrice));
    if (query.maxPrice != null)          params = params.set('maxPrice', String(query.maxPrice));

    return this.api.get<ApiResponse<PublicProduct[]>>('/products', params).pipe(
      tap({
        next: res => {
          this.products.set(res.data ?? []);
          this.total.set(res.meta?.total ?? res.data?.length ?? 0);
          this.loadingProducts.set(false);
        },
        error: () => this.loadingProducts.set(false)
      })
    );
  }

  /** GET /products/:slug — fetches a single product for the detail page. */
  getProductBySlug(slug: string): Observable<ApiResponse<PublicProduct>> {
    return this.api.get<ApiResponse<PublicProduct>>(`/products/${encodeURIComponent(slug)}`);
  }

  /**
   * GET /products — fetch up to `limit` products from the same category,
   * excluding the current product. Used for the related products row.
   * Returns a plain Observable; the caller manages its own local state.
   */
  loadRelatedProducts(categoryId: string, excludeSlug: string, limit = 4): Observable<ApiResponse<PublicProduct[]>> {
    const params = new HttpParams()
      .set('categoryId', categoryId)
      .set('limit', String(limit + 1)); // fetch one extra so we can exclude current

    return this.api.get<ApiResponse<PublicProduct[]>>('/products', params);
  }
}
