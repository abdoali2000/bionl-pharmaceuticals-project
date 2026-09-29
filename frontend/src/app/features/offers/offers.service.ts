import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

// ── Models ────────────────────────────────────────────────────────────────────

export interface Offer {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  imageUrl: string | null;
  cloudinaryPublicId?: string | null;
  showInTopBanner: boolean;
  startDate: string;
  endDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: { total?: number } | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class OffersService {
  private api = inject(ApiService);

  // ── Public signals ─────────────────────────────────────────────────────────

  readonly offers = signal<Offer[]>([]);
  readonly bannerOffers = signal<Offer[]>([]);
  readonly loading = signal(false);

  // ── Admin signals ──────────────────────────────────────────────────────────

  readonly adminOffers = signal<Offer[]>([]);
  readonly adminLoading = signal(false);
  readonly saving = signal(false);

  // ── Public endpoints ───────────────────────────────────────────────────────

  /** GET /offers — returns only currently active offers. Excludes cloudinaryPublicId. */
  loadOffers(): Observable<ApiResponse<Offer[]>> {
    this.loading.set(true);
    return this.api.get<ApiResponse<Offer[]>>('/offers').pipe(
      tap({
        next: res => {
          this.offers.set(res.data ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  /** GET /offers/banner — active offers where showInTopBanner = true. */
  loadBannerOffers(): Observable<ApiResponse<Offer[]>> {
    return this.api.get<ApiResponse<Offer[]>>('/offers/banner').pipe(
      tap({
        next: res => this.bannerOffers.set(res.data ?? []),
        error: () => {},
      })
    );
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  /** GET /admin/offers — returns all offers (past, active, future) ordered by startDate DESC. */
  adminLoadAll(): Observable<ApiResponse<Offer[]>> {
    this.adminLoading.set(true);
    return this.api.get<ApiResponse<Offer[]>>('/admin/offers').pipe(
      tap({
        next: res => {
          this.adminOffers.set(res.data ?? []);
          this.adminLoading.set(false);
        },
        error: () => this.adminLoading.set(false),
      })
    );
  }

  /** GET /admin/offers/:id — returns a single offer by ID. */
  adminGetById(id: string): Observable<ApiResponse<Offer>> {
    return this.api.get<ApiResponse<Offer>>(`/admin/offers/${id}`);
  }

  /**
   * POST /admin/offers — multipart/form-data.
   * Caller builds the FormData with all text fields and an optional `image` file.
   */
  adminCreate(formData: FormData): Observable<ApiResponse<Offer>> {
    this.saving.set(true);
    return this.api.post<ApiResponse<Offer>>('/admin/offers', formData).pipe(
      tap({
        next: res => {
          if (res.success && res.data) {
            this.adminOffers.update(list => [res.data, ...list]);
          }
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      })
    );
  }

  /**
   * PATCH /admin/offers/:id — multipart/form-data.
   * Caller builds the FormData with the fields to update and an optional new `image` file.
   */
  adminUpdate(id: string, formData: FormData): Observable<ApiResponse<Offer>> {
    this.saving.set(true);
    return this.api.patch<ApiResponse<Offer>>(`/admin/offers/${id}`, formData).pipe(
      tap({
        next: res => {
          if (res.success && res.data) {
            this.adminOffers.update(list => list.map(o => o.id === id ? res.data : o));
          }
          this.saving.set(false);
        },
        error: () => this.saving.set(false),
      })
    );
  }

  /** DELETE /admin/offers/:id — deletes the offer and its Cloudinary image if one exists. */
  adminDelete(id: string): Observable<ApiResponse<null>> {
    return this.api.delete<ApiResponse<null>>(`/admin/offers/${id}`).pipe(
      tap(res => {
        if (res.success) {
          this.adminOffers.update(list => list.filter(o => o.id !== id));
        }
      })
    );
  }
}
