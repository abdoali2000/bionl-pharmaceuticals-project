import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { Skeleton } from 'primeng/skeleton';

// App
import { OffersService, Offer } from '../../offers.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-offers-page',
  standalone: true,
  imports: [CommonModule, Skeleton],
  styles: [`
    :host {
      display: block;
      background: #f8fafc;
      min-height: 100vh;
    }

    /* ── Page header ─────────────────────────────────────────────────── */
    .page-header {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 1.25rem 1rem;
    }

    .page-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.25rem;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    /* ── Grid ────────────────────────────────────────────────────────── */
    .grid-container {
      padding: 1rem;
    }

    .offers-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    @media (min-width: 640px) {
      .offers-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (min-width: 1024px) {
      .offers-grid { grid-template-columns: repeat(3, 1fr); }
    }

    @media (min-width: 1280px) {
      .offers-grid { grid-template-columns: repeat(4, 1fr); }
    }

    /* ── Offer card ──────────────────────────────────────────────────── */
    .offer-card {
      background: #ffffff;
      border-radius: 0.875rem;
      border: 1px solid #e2e8f0;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: box-shadow 0.2s, transform 0.2s;
    }

    .offer-card:hover {
      box-shadow: 0 8px 24px rgba(79, 70, 229, 0.12);
      transform: translateY(-2px);
    }

    .offer-image-wrap {
      position: relative;
      width: 100%;
      padding-top: 52%;          /* 52% aspect ratio */
      overflow: hidden;
      background: #f1f5f9;
    }

    .offer-image {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .offer-image-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #ede9fe 0%, #c7d2fe 100%);
    }

    .offer-image-placeholder i {
      font-size: 2.5rem;
      color: #6366f1;
      opacity: 0.6;
    }

    .offer-body {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .offer-title {
      font-size: 1rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      line-height: 1.35;
    }

    .offer-description {
      font-size: 0.875rem;
      color: #475569;
      margin: 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .offer-dates {
      margin-top: auto;
      padding-top: 0.75rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .offer-date-row {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.8125rem;
      color: #64748b;
    }

    .offer-date-row i {
      color: #6366f1;
      font-size: 0.875rem;
    }

    /* ── Empty state ─────────────────────────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem 1.5rem;
      gap: 1rem;
      text-align: center;
    }

    .empty-icon {
      font-size: 3.5rem;
      color: #cbd5e1;
    }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #475569;
      margin: 0;
    }

    .empty-subtitle {
      font-size: 0.9375rem;
      color: #94a3b8;
      margin: 0;
    }

    /* ── Error state ─────────────────────────────────────────────────── */
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 4rem 1.5rem;
      gap: 1rem;
      text-align: center;
    }

    .error-icon {
      font-size: 2.5rem;
      color: #f87171;
    }

    .error-msg {
      font-size: 1rem;
      font-weight: 600;
      color: #475569;
      margin: 0;
    }

    .retry-btn {
      padding: 0.5rem 1.25rem;
      border: none;
      border-radius: 0.5rem;
      background: #6366f1;
      color: #fff;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .retry-btn:hover { background: #4f46e5; }
  `],
  template: `
    <!-- Page header -->
    <div class="page-header" [attr.dir]="isAr() === 'ar' ? 'rtl' : 'ltr'">
      <h1 class="page-title">
        {{ isAr() === 'ar' ? 'العروض الحالية' : 'Current Offers' }}
      </h1>
      @if (!offersService.loading()) {
        <p class="page-subtitle">
          {{ offersService.offers().length }}
          {{ isAr() === 'ar' ? 'عرض نشط' : (offersService.offers().length === 1 ? 'active offer' : 'active offers') }}
        </p>
      }
    </div>

    <!-- Grid container -->
    <div class="grid-container">

      <!-- Skeleton loading -->
      @if (offersService.loading()) {
        <div class="offers-grid">
          @for (n of skeletonItems; track n) {
            <div>
              <p-skeleton height="0" style="padding-top:52%;display:block;border-radius:0.875rem 0.875rem 0 0" />
              <p-skeleton width="70%" height="1.125rem" style="margin:0.75rem 1rem 0" />
              <p-skeleton width="90%" height="0.875rem" style="margin:0.5rem 1rem 0" />
              <p-skeleton width="60%" height="0.875rem" style="margin:0.25rem 1rem 1rem" />
            </div>
          }
        </div>
      }

      <!-- Error state -->
      @else if (hasError()) {
        <div class="error-state">
          <i class="pi pi-exclamation-triangle error-icon"></i>
          <p class="error-msg">
            {{ isAr() === 'ar' ? 'حدث خطأ أثناء تحميل العروض' : 'Failed to load offers' }}
          </p>
          <button class="retry-btn" (click)="retryLoad()">
            {{ isAr() === 'ar' ? 'إعادة المحاولة' : 'Try again' }}
          </button>
        </div>
      }

      <!-- Empty state -->
      @else if (offersService.offers().length === 0) {
        <div class="empty-state">
          <i class="pi pi-tag empty-icon"></i>
          <p class="empty-title">
            {{ isAr() === 'ar' ? 'لا توجد عروض نشطة في الوقت الحالي' : 'No active offers at the moment' }}
          </p>
          <p class="empty-subtitle">
            {{ isAr() === 'ar'
              ? 'تابعنا للاطلاع على العروض القادمة'
              : 'Stay tuned for upcoming deals' }}
          </p>
        </div>
      }

      <!-- Offer cards grid -->
      @else {
        <div class="offers-grid" [attr.dir]="isAr() === 'ar' ? 'rtl' : 'ltr'">
          @for (offer of offersService.offers(); track offer.id) {
            <article class="offer-card">

              <!-- Image or placeholder -->
              <div class="offer-image-wrap">
                @if (offer.imageUrl) {
                  <img
                    class="offer-image"
                    [src]="offer.imageUrl"
                    [alt]="isAr() === 'ar' ? offer.titleAr : offer.titleEn"
                    loading="lazy"
                  />
                } @else {
                  <div class="offer-image-placeholder">
                    <i class="pi pi-tag"></i>
                  </div>
                }
              </div>

              <!-- Card body -->
              <div class="offer-body">

                <!-- Title -->
                <h2 class="offer-title">
                  {{ isAr() === 'ar' ? offer.titleAr : offer.titleEn }}
                </h2>

                <!-- Description (only shown when present) -->
                @if (isAr() === 'ar' ? offer.descriptionAr : offer.descriptionEn) {
                  <p class="offer-description">
                    {{ isAr() === 'ar' ? offer.descriptionAr : offer.descriptionEn }}
                  </p>
                }

                <!-- Dates -->
                <div class="offer-dates">
                  <div class="offer-date-row">
                    <i class="pi pi-calendar"></i>
                    <span>
                      {{ isAr() === 'ar' ? 'من:' : 'From:' }}
                      {{ offer.startDate | date: 'd MMM yyyy' }}
                    </span>
                  </div>
                  <div class="offer-date-row">
                    <i class="pi pi-calendar-times"></i>
                    <span>
                      {{ isAr() === 'ar' ? 'حتى:' : 'Until:' }}
                      {{ offer.endDate | date: 'd MMM yyyy' }}
                    </span>
                  </div>
                </div>

              </div>
            </article>
          }
        </div>
      }

    </div>
  `
})
export class OffersPageComponent implements OnInit {
  readonly offersService = inject(OffersService);
  private readonly langService = inject(LanguageService);

  readonly isAr = this.langService.currentLang;
  readonly hasError = signal(false);

  readonly skeletonItems = Array.from({ length: 8 }, (_, i) => i);

  ngOnInit(): void {
    this.loadOffers();
  }

  retryLoad(): void {
    this.hasError.set(false);
    this.loadOffers();
  }

  private loadOffers(): void {
    this.offersService.loadOffers().subscribe({
      error: () => this.hasError.set(true),
    });
  }
}
