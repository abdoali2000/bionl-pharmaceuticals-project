import { Component, OnInit, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OffersService, Offer } from '../../../features/offers/offers.service';
import { LanguageService } from '../../../core/services/language.service';

/**
 * TopBannerComponent — shared, placed at the very top of PublicLayoutComponent.
 *
 * Business rules:
 * - Fetches GET /offers/banner on init.
 * - When the banner array is empty the element has zero height (overflow:hidden,
 *   no margin/padding) so it causes zero layout shift.
 * - When offers exist, a CSS marquee scrolls the offer titles continuously.
 * - Titles are reactive to the current language via LanguageService.
 */
@Component({
  selector: 'app-top-banner',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host {
      display: block;
      overflow: hidden;
    }

    .banner-outer {
      background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 50%, #4f46e5 100%);
      color: #ffffff;
      padding: 0.5rem 0;
      overflow: hidden;
      position: relative;
    }

    /* Marquee track — the inner content scrolls from right to left by default.
       For RTL (Arabic) it is reversed by animation direction. */
    .marquee-track {
      display: flex;
      width: max-content;
      animation: marquee-ltr 28s linear infinite;
    }

    .marquee-track.rtl {
      animation: marquee-rtl 28s linear infinite;
    }

    @keyframes marquee-ltr {
      from { transform: translateX(0); }
      to   { transform: translateX(-50%); }
    }

    @keyframes marquee-rtl {
      from { transform: translateX(-50%); }
      to   { transform: translateX(0); }
    }

    .marquee-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      white-space: nowrap;
      font-size: 0.875rem;
      font-weight: 600;
      padding: 0 2.5rem;
    }

    .marquee-separator {
      color: rgba(255, 255, 255, 0.5);
      font-size: 1rem;
    }
  `],
  template: `
    <!-- When there are no banner offers the outer element is empty
         and :host stays collapsed (overflow:hidden, no height). -->
    @if (offersService.bannerOffers().length > 0) {
      <div class="banner-outer" role="marquee" [attr.aria-label]="isAr() === 'ar' ? 'عروض الشريط العلوي' : 'Top banner offers'">
        <!--
          The track is duplicated (rendered twice end-to-end) so the scroll
          loops seamlessly with no visible gap.
        -->
        <div class="marquee-track" [class.rtl]="isAr() === 'ar'">
          @for (offer of bannerTitles(); track offer.id; let last = $last) {
            <span class="marquee-item">
              <span>{{ offer.title }}</span>
              @if (!last) {
                <span class="marquee-separator">✦</span>
              }
            </span>
          }
          <!-- Duplicate for seamless loop -->
          @for (offer of bannerTitles(); track 'dup-' + offer.id; let last = $last) {
            <span class="marquee-item">
              <span>{{ offer.title }}</span>
              @if (!last) {
                <span class="marquee-separator">✦</span>
              }
            </span>
          }
        </div>
      </div>
    }
  `
})
export class TopBannerComponent implements OnInit {
  readonly offersService = inject(OffersService);
  private readonly langService = inject(LanguageService);

  /** Exposes the raw language signal so the template can compare with 'ar'. */
  readonly isAr = this.langService.currentLang;

  /**
   * Computed: maps bannerOffers to { id, title } picking the correct
   * localised title based on the current language signal.
   */
  readonly bannerTitles = computed<{ id: string; title: string }[]>(() => {
    const lang = this.langService.currentLang();
    return this.offersService.bannerOffers().map((o: Offer) => ({
      id: o.id,
      title: lang === 'ar' ? o.titleAr : o.titleEn,
    }));
  });

  ngOnInit(): void {
    // Non-critical: errors are silently swallowed by the service
    this.offersService.loadBannerOffers().subscribe();
  }
}
