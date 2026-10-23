import { Component, inject, computed } from '@angular/core';
import { OffersService } from '../../../features/offers/offers.service';
import { LanguageService } from '../../../core/services/language.service';
@Component({
  selector: 'app-top-banner',
  standalone: true,
  template: `@if (titles().length) {
    <div
      class="offer-marquee"
      [attr.aria-label]="
        lang.currentLang() === 'ar' ? 'آخر عروض بيو إن إل' : 'Latest Bio NL offers'
      "
    >
      <div class="marquee-track" dir="ltr">
        @for (copy of copies; track copy) {
          <div class="marquee-group" [attr.aria-hidden]="copy ? 'true' : null">
            @for (repeat of repeats; track repeat) {
              @for (title of titles(); track $index) {
                <span [attr.dir]="lang.currentLang() === 'ar' ? 'rtl' : 'ltr'"
                  >{{ title }} <i>✦</i></span
                >
              }
            }
          </div>
        }
      </div>
    </div>
  }`,
})
export class TopBannerComponent {
  readonly offers = inject(OffersService);
  readonly lang = inject(LanguageService);
  readonly copies = [0, 1];
  readonly repeats = [0, 1, 2];
  readonly titles = computed(() =>
    this.offers
      .bannerOffers()
      .map((o) => (this.lang.currentLang() === 'ar' ? o.titleAr : o.titleEn)),
  );
  constructor() {
    this.offers.loadBannerOffers().subscribe({ error: () => this.offers.bannerOffers.set([]) });
  }
}
