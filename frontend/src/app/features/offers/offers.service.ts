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

  readonly offers = signal<Offer[]>([]);
  readonly bannerOffers = signal<Offer[]>([]);
  readonly loading = signal(false);

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
}
