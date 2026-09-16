import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

// ── Models ────────────────────────────────────────────────────────────────────

export interface ProductCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
}

export interface ProductImage {
  id: string;
  imageUrl: string;
  displayOrder: number;
}

export interface AdminProduct {
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
  coverImagePublicId: string;
  categories: ProductCategory[];
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: { total?: number } | null;
}

export interface ReorderImageItem {
  id: string;
  displayOrder: number;
}

export interface UpdateProductTextPayload {
  nameAr?: string;
  nameEn?: string;
  descriptionAr?: string;
  descriptionEn?: string;
  ingredientsAr?: string;
  ingredientsEn?: string;
  usageInstructionsAr?: string;
  usageInstructionsEn?: string;
  price?: number;
  categoryIds?: string[];
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminProductsService {
  private api = inject(ApiService);

  /** Reactive list of all products, kept in sync after mutations. */
  readonly products = signal<AdminProduct[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  // ── Read operations ────────────────────────────────────────────────────────

  /** GET /admin/products — loads all products into the reactive signal. */
  loadAll(): Observable<ApiResponse<AdminProduct[]>> {
    this.loading.set(true);
    return this.api.get<ApiResponse<AdminProduct[]>>('/admin/products').pipe(
      tap({
        next: res => {
          this.products.set(res.data ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      })
    );
  }

  /** GET /admin/products/:id — by UUID, returns full admin product. */
  getById(id: string): Observable<ApiResponse<AdminProduct>> {
    return this.api.get<ApiResponse<AdminProduct>>(`/admin/products/${id}`);
  }

  // ── Write operations ───────────────────────────────────────────────────────

  /**
   * POST /admin/products — multipart/form-data.
   * Caller builds the FormData with text fields + coverImage file.
   */
  create(formData: FormData): Observable<ApiResponse<AdminProduct>> {
    this.saving.set(true);
    return this.api.post<ApiResponse<AdminProduct>>('/admin/products', formData).pipe(
      tap({
        next: res => {
          if (res.success && res.data) {
            this.products.update(list => [res.data, ...list]);
          }
          this.saving.set(false);
        },
        error: () => this.saving.set(false)
      })
    );
  }

  /**
   * PATCH /admin/products/:id — JSON only, updates text fields and categories.
   * Does NOT touch images.
   */
  updateText(id: string, payload: UpdateProductTextPayload): Observable<ApiResponse<AdminProduct>> {
    this.saving.set(true);
    return this.api.patch<ApiResponse<AdminProduct>>(`/admin/products/${id}`, payload).pipe(
      tap({
        next: res => {
          if (res.success && res.data) {
            this.products.update(list => list.map(p => p.id === id ? res.data : p));
          }
          this.saving.set(false);
        },
        error: () => this.saving.set(false)
      })
    );
  }

  /** DELETE /admin/products/:id — removes the product and cascades in the API. */
  delete(id: string): Observable<ApiResponse<null>> {
    return this.api.delete<ApiResponse<null>>(`/admin/products/${id}`).pipe(
      tap(res => {
        if (res.success) {
          this.products.update(list => list.filter(p => p.id !== id));
        }
      })
    );
  }

  // ── Cover image ────────────────────────────────────────────────────────────

  /**
   * PATCH /admin/products/:id/cover-image — multipart/form-data.
   * Caller builds the FormData with a single `coverImage` file.
   */
  replaceCover(id: string, formData: FormData): Observable<ApiResponse<{ coverImageUrl: string; coverImagePublicId: string }>> {
    this.saving.set(true);
    return this.api.patch<ApiResponse<{ coverImageUrl: string; coverImagePublicId: string }>>(
      `/admin/products/${id}/cover-image`,
      formData
    ).pipe(
      tap({
        next: res => {
          if (res.success && res.data) {
            this.products.update(list =>
              list.map(p =>
                p.id === id
                  ? { ...p, coverImageUrl: res.data.coverImageUrl, coverImagePublicId: res.data.coverImagePublicId }
                  : p
              )
            );
          }
          this.saving.set(false);
        },
        error: () => this.saving.set(false)
      })
    );
  }

  // ── Gallery images ─────────────────────────────────────────────────────────

  /**
   * POST /admin/products/:id/images — multipart/form-data, field name `images`.
   * Returns the updated product (or just the new images array).
   */
  addImages(id: string, formData: FormData): Observable<ApiResponse<AdminProduct>> {
    this.saving.set(true);
    return this.api.post<ApiResponse<AdminProduct>>(`/admin/products/${id}/images`, formData).pipe(
      tap({
        next: () => this.saving.set(false),
        error: () => this.saving.set(false)
      })
    );
  }

  /** DELETE /admin/products/:id/images/:imageId */
  deleteImage(productId: string, imageId: string): Observable<ApiResponse<null>> {
    return this.api.delete<ApiResponse<null>>(`/admin/products/${productId}/images/${imageId}`);
  }

  /**
   * PATCH /admin/products/:id/images/reorder — JSON body `{ images: [{ id, displayOrder }] }`.
   */
  reorderImages(productId: string, items: ReorderImageItem[]): Observable<ApiResponse<null>> {
    return this.api.patch<ApiResponse<null>>(
      `/admin/products/${productId}/images/reorder`,
      { images: items }
    );
  }
}
