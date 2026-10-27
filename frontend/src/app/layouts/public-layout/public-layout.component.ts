import { Component, inject, signal, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CartDrawerComponent } from '../../shared/components/cart-drawer/cart-drawer.component';
import { CartService } from '../../core/services/cart.service';
import { LanguageService } from '../../core/services/language.service';
import { TopBannerComponent } from '../../shared/components/top-banner/top-banner.component';
import { CATALOG_PREVIEW } from '../../features/brand/catalog-preview';
import { AmbientBackgroundComponent } from '../../features/brand/ambient-background.component';
@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CartDrawerComponent,
    TopBannerComponent,
    AmbientBackgroundComponent,
  ],
  template: `
    <app-ambient-background />
    <a href="#main-content" class="skip-link">{{ t('انتقل إلى المحتوى', 'Skip to content') }}</a
    ><app-top-banner />
    <header class="brand-header">
      <div class="wrap header-inner">
        <a routerLink="/" class="brand-logo" aria-label="Bio NL home"
          ><img src="/brand/logo.png" alt="Bio NL Pharmaceuticals" /><span
            ><b>Bio<span>NL</span></b
            ><small>PHARMACEUTICALS</small></span
          ></a
        >
        <nav class="desktop-nav" aria-label="Main navigation">
          @for (l of links; track l.path) {
            <a
              [routerLink]="l.path"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              >{{ t(l.ar, l.en) }}</a
            >
          }
        </nav>
        <div class="header-actions">
          <button
            class="language-toggle"
            (click)="lang.toggleLanguage()"
            aria-label="Switch language"
          >
            {{ lang.currentLang() === 'ar' ? 'EN' : 'عربي' }} <i class="pi pi-globe"></i></button
          ><button
            class="bag-button"
            (click)="cartDrawer.open()"
            [attr.aria-label]="t('افتح السلة', 'Open cart')"
          >
            <i class="pi pi-shopping-bag"></i>
            @if (cart.totalItems()) {
              <span>{{ cart.totalItems() }}</span>
            }</button
          ><button
            class="menu-toggle"
            (click)="menuOpen.set(!menuOpen())"
            [attr.aria-expanded]="menuOpen()"
            aria-controls="mobile-nav"
            [attr.aria-label]="t('القائمة', 'Menu')"
          >
            <i [class]="menuOpen() ? 'pi pi-times' : 'pi pi-bars'"></i>
          </button>
        </div>
      </div>
      @if (menuOpen()) {
        <nav class="mobile-nav" id="mobile-nav">
          @for (l of links; track l.path) {
            <a
              [routerLink]="l.path"
              (click)="menuOpen.set(false)"
              routerLinkActive="active"
              [routerLinkActiveOptions]="{ exact: true }"
              >{{ t(l.ar, l.en) }} <span>↗</span></a
            >
          }
        </nav>
      }
    </header>
    @if (preview) {
      <div class="preview-label">
        {{
          t(
            'معاينة التصميم · المنتجات والأسعار والعروض تجريبية',
            'DESIGN PREVIEW · Illustrative products, prices and offers'
          )
        }}
      </div>
    }
    <main id="main-content" tabindex="-1"><router-outlet /></main>
    <footer class="brand-footer">
      <div class="wrap footer-top">
        <div>
          <a routerLink="/" class="brand-logo"
            ><img src="/brand/logo.png" alt="Bio NL" /><span
              ><b>Bio<span>NL</span></b
              ><small>PHARMACEUTICALS</small></span
            ></a
          >
          <p>{{ t('عناية تبدأ من التفاصيل.', 'Care begins with the details.') }}</p>
        </div>
        <div>
          <span class="eyebrow">{{ t('اكتشف بيو إن إل', 'EXPLORE') }}</span
          ><a routerLink="/products">{{ t('المنتجات', 'The collection') }}</a
          ><a routerLink="/about">{{ t('من نحن', 'Our story') }}</a
          ><a routerLink="/offers">{{ t('العروض', 'What’s new') }}</a>
        </div>
        <div>
          <span class="eyebrow">{{ t('خلينا على تواصل', 'STAY CONNECTED') }}</span>
          <p>{{ t('عندك استفسار عن منتج؟', 'A question about a product?') }}</p>
          <a class="footer-contact" routerLink="/contact"
            >{{ t('يسعدنا نسمع منك', 'We’d love to hear from you') }} ↗</a
          >
        </div>
      </div>
      <div class="wrap footer-bottom">
        <span>© {{ year }} Bio NL Pharmaceuticals</span
        ><span>{{
          t(
            'معلومات المنتجات لا تُغني عن استشارة المختص.',
            'Product information does not replace professional advice.'
          )
        }}</span>
      </div>
    </footer>
    <app-cart-drawer #cartDrawer />
  `,
})
export class PublicLayoutComponent {
  readonly lang = inject(LanguageService);
  readonly cart = inject(CartService);
  readonly preview = CATALOG_PREVIEW;
  readonly year = new Date().getFullYear();
  readonly menuOpen = signal(false);
  @ViewChild(CartDrawerComponent) cartDrawer!: CartDrawerComponent;
  readonly links = [
    { path: '/', ar: 'الرئيسية', en: 'Home' },
    { path: '/products', ar: 'المنتجات', en: 'Products' },
    { path: '/about', ar: 'من نحن', en: 'Our story' },
    { path: '/offers', ar: 'العروض', en: 'Offers' },
    { path: '/contact', ar: 'تواصل معنا', en: 'Contact' },
  ];
  constructor() {
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((e) => {
        if (e instanceof NavigationEnd) this.menuOpen.set(false);
      });
  }
  t(ar: string, en: string) {
    return this.lang.currentLang() === 'ar' ? ar : en;
  }
}
