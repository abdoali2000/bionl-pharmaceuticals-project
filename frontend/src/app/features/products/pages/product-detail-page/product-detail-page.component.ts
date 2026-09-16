import {
  Component, OnInit, inject, signal, computed, DestroyRef, PLATFORM_ID
} from '@angular/core';
import { CommonModule, CurrencyPipe, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { switchMap, catchError, of, tap } from 'rxjs';

// PrimeNG
import { Skeleton } from 'primeng/skeleton';
import { Button } from 'primeng/button';

// App
import { ProductsService, PublicProduct } from '../../products.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ImageGalleryComponent } from '../../../../shared/components/image-gallery/image-gallery.component';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';

type PageState = 'loading' | 'loaded' | 'not-found' | 'error';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    Skeleton,
    Button,
    ImageGalleryComponent,
    ProductCardComponent,
  ],
  styles: [`
    :host {
      display: block;
      background: #f8fafc;
      min-height: 100vh;
    }

    /* ── Breadcrumb ──────────────────────────────────────────────────────────── */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.875rem 1rem;
      font-size: 0.8125rem;
      color: #64748b;
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      flex-wrap: wrap;
    }

    .breadcrumb a {
      color: #6366f1;
      text-decoration: none;
      font-weight: 500;
    }

    .breadcrumb a:hover { text-decoration: underline; }

    .breadcrumb-sep { color: #cbd5e1; }

    .breadcrumb-current {
      color: #475569;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 200px;
    }

    /* ── Main product layout ─────────────────────────────────────────────────── */
    .product-section {
      padding: 1.25rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* Side-by-side on tablet+ */
    @media (min-width: 768px) {
      .product-section {
        flex-direction: row;
        align-items: flex-start;
        gap: 2.5rem;
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
      }

      .gallery-col { flex: 0 0 42%; max-width: 42%; }
      .details-col { flex: 1; min-width: 0; }
    }

    /* ── Gallery column ──────────────────────────────────────────────────────── */
    .gallery-col { width: 100%; }

    /* ── Details column ──────────────────────────────────────────────────────── */
    .details-col {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    /* Categories */
    .category-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.375rem;
    }

    .cat-badge {
      font-size: 0.75rem;
      font-weight: 500;
      padding: 0.25rem 0.625rem;
      border-radius: 999px;
      background: rgba(99,102,241,0.1);
      color: #6366f1;
      border: 1px solid rgba(99,102,241,0.2);
    }

    /* Name */
    .product-name {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      line-height: 1.3;
    }

    /* Price */
    .product-price {
      font-size: 1.625rem;
      font-weight: 800;
      color: #6366f1;
      margin: 0;
    }

    /* Divider */
    .section-divider {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 0.25rem 0;
    }

    /* Bilingual content sections */
    .info-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .info-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }

    .info-text {
      font-size: 0.9375rem;
      color: #475569;
      line-height: 1.7;
      margin: 0;
      white-space: pre-line;
    }

    /* ── Related products ────────────────────────────────────────────────────── */
    .related-section {
      padding: 1.5rem 1rem;
      border-top: 1px solid #e2e8f0;
      background: #ffffff;
    }

    .related-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 1rem;
    }

    .related-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.875rem;
    }

    @media (min-width: 640px) {
      .related-grid { grid-template-columns: repeat(4, 1fr); }
    }

    /* ── Skeleton layouts ────────────────────────────────────────────────────── */
    .skeleton-layout {
      padding: 1.25rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    @media (min-width: 768px) {
      .skeleton-layout {
        flex-direction: row;
        gap: 2.5rem;
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
      }

      .skeleton-gallery { flex: 0 0 42%; }
      .skeleton-details { flex: 1; display: flex; flex-direction: column; gap: 0.75rem; }
    }

    /* ── Empty / Error states ────────────────────────────────────────────────── */
    .state-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 5rem 1.5rem;
      text-align: center;
      gap: 1.25rem;
    }

    .state-icon { font-size: 3rem; color: #cbd5e1; }
    .state-icon.error-icon { color: #f87171; }

    .state-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #475569;
      margin: 0;
    }

    .state-subtitle {
      font-size: 0.9375rem;
      color: #94a3b8;
      margin: 0;
    }
  `],
  template: `
    <!-- ── Loading skeleton ──────────────────────────────────────────────────── -->
    @if (pageState() === 'loading') {
      <!-- Breadcrumb skeleton -->
      <div style="padding:0.875rem 1rem;background:#fff;border-bottom:1px solid #e2e8f0">
        <p-skeleton width="220px" height="16px" />
      </div>

      <div class="skeleton-layout">
        <div class="skeleton-gallery">
          <p-skeleton height="0" style="padding-top:100%;display:block;border-radius:0.875rem" />
          <div style="display:flex;gap:0.5rem;margin-top:0.75rem">
            @for (n of [1,2,3]; track n) {
              <p-skeleton width="64px" height="64px" borderRadius="0.5rem" />
            }
          </div>
        </div>
        <div class="skeleton-details">
          <p-skeleton width="120px" height="24px" borderRadius="999px" />
          <p-skeleton width="80%" height="32px" />
          <p-skeleton width="40%" height="28px" />
          <p-skeleton height="1px" style="margin:0.25rem 0" />
          <p-skeleton width="100%" height="80px" />
          <p-skeleton width="100%" height="60px" />
        </div>
      </div>
    }

    <!-- ── 404 Not Found ─────────────────────────────────────────────────────── -->
    @else if (pageState() === 'not-found') {
      <div class="state-container">
        <i class="pi pi-box state-icon"></i>
        <p class="state-title">
          {{ isAr() ? 'المنتج غير موجود' : 'Product not found' }}
        </p>
        <p class="state-subtitle">
          {{ isAr()
            ? 'لم يتم العثور على هذا المنتج. ربما تم حذفه أو تغيير رابطه.'
            : 'This product could not be found. It may have been removed or its URL has changed.' }}
        </p>
        <p-button
          [label]="isAr() ? 'العودة إلى المنتجات' : 'Back to Products'"
          icon="pi pi-arrow-left"
          routerLink="/products"
        />
      </div>
    }

    <!-- ── Generic error ─────────────────────────────────────────────────────── -->
    @else if (pageState() === 'error') {
      <div class="state-container">
        <i class="pi pi-exclamation-triangle state-icon error-icon"></i>
        <p class="state-title">
          {{ isAr() ? 'حدث خطأ أثناء التحميل' : 'Something went wrong' }}
        </p>
        <p-button
          [label]="isAr() ? 'إعادة المحاولة' : 'Try again'"
          icon="pi pi-refresh"
          (click)="load()"
        />
      </div>
    }

    <!-- ── Loaded product ─────────────────────────────────────────────────────── -->
    @else if (pageState() === 'loaded' && product()) {
      <!-- Breadcrumb -->
      <nav class="breadcrumb" [attr.dir]="isAr() ? 'rtl' : 'ltr'" aria-label="Breadcrumb">
        <a routerLink="/">{{ isAr() ? 'الرئيسية' : 'Home' }}</a>
        <span class="breadcrumb-sep">›</span>
        <a routerLink="/products">{{ isAr() ? 'المنتجات' : 'Products' }}</a>
        <span class="breadcrumb-sep">›</span>
        <span class="breadcrumb-current">{{ displayName() }}</span>
      </nav>

      <!-- Product section -->
      <div class="product-section">
        <!-- Gallery -->
        <div class="gallery-col">
          <app-image-gallery
            [coverImageUrl]="product()!.coverImageUrl"
            [altText]="displayName()"
            [galleryImages]="product()!.images"
          />
        </div>

        <!-- Details -->
        <div class="details-col" [attr.dir]="isAr() ? 'rtl' : 'ltr'">
          <!-- Category badges -->
          @if (product()!.categories.length > 0) {
            <div class="category-badges">
              @for (cat of product()!.categories; track cat.id) {
                <span class="cat-badge">{{ isAr() ? cat.nameAr : cat.nameEn }}</span>
              }
            </div>
          }

          <!-- Name -->
          <h1 class="product-name">{{ displayName() }}</h1>

          <!-- Price -->
          <p class="product-price">
            {{ product()!.price | currency : 'EGP' : 'symbol-narrow' : '1.0-2' }}
          </p>

          <!-- Description -->
          @if (displayDescription()) {
            <hr class="section-divider" />
            <div class="info-section">
              <p class="info-label">{{ isAr() ? 'الوصف' : 'Description' }}</p>
              <p class="info-text">{{ displayDescription() }}</p>
            </div>
          }

          <!-- Ingredients -->
          @if (displayIngredients()) {
            <hr class="section-divider" />
            <div class="info-section">
              <p class="info-label">{{ isAr() ? 'المكونات' : 'Ingredients' }}</p>
              <p class="info-text">{{ displayIngredients() }}</p>
            </div>
          }

          <!-- Usage instructions -->
          @if (displayUsage()) {
            <hr class="section-divider" />
            <div class="info-section">
              <p class="info-label">{{ isAr() ? 'طريقة الاستخدام' : 'Usage Instructions' }}</p>
              <p class="info-text">{{ displayUsage() }}</p>
            </div>
          }
        </div>
      </div>

      <!-- Related products -->
      @if (relatedProducts().length > 0) {
        <section class="related-section">
          <h2 class="related-title" [attr.dir]="isAr() ? 'rtl' : 'ltr'">
            {{ isAr() ? 'منتجات ذات صلة' : 'Related Products' }}
          </h2>
          <div class="related-grid">
            @for (p of relatedProducts(); track p.id) {
              <app-product-card [product]="p" />
            }
          </div>
        </section>
      }
    }
  `
})
export class ProductDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private langService = inject(LanguageService);
  private productsService = inject(ProductsService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  readonly isAr = this.langService.currentLang;

  readonly pageState = signal<PageState>('loading');
  readonly product = signal<PublicProduct | null>(null);
  readonly relatedProducts = signal<PublicProduct[]>([]);

  // ── Computed bilingual display values ──────────────────────────────────────

  readonly displayName = computed(() => {
    const p = this.product();
    if (!p) return '';
    return this.isAr() === 'ar' ? p.nameAr : p.nameEn;
  });

  readonly displayDescription = computed(() => {
    const p = this.product();
    if (!p) return null;
    return this.isAr() === 'ar' ? p.descriptionAr : p.descriptionEn;
  });

  readonly displayIngredients = computed(() => {
    const p = this.product();
    if (!p) return null;
    return this.isAr() === 'ar' ? p.ingredientsAr : p.ingredientsEn;
  });

  readonly displayUsage = computed(() => {
    const p = this.product();
    if (!p) return null;
    return this.isAr() === 'ar' ? p.usageInstructionsAr : p.usageInstructionsEn;
  });

  ngOnInit(): void {
    // React to route param changes (e.g. navigating from related product)
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const slug = params.get('slug') ?? '';
        this.load(slug);
      });
  }

  load(slug?: string): void {
    const targetSlug = slug ?? this.route.snapshot.paramMap.get('slug') ?? '';
    this.pageState.set('loading');
    this.product.set(null);
    this.relatedProducts.set([]);

    this.productsService.getProductBySlug(targetSlug)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          if (!res.success || !res.data) {
            this.pageState.set('not-found');
            this.setNotFoundMeta();
            return;
          }

          const p = res.data;
          this.product.set(p);
          this.pageState.set('loaded');
          this.setMeta(p);
          this.loadRelated(p);
        },
        error: err => {
          if (err?.status === 404) {
            this.pageState.set('not-found');
            this.setNotFoundMeta();
          } else {
            this.pageState.set('error');
          }
        }
      });
  }

  // ── SEO meta helpers ────────────────────────────────────────────────────────

  private setMeta(p: PublicProduct): void {
    const lang = this.isAr();
    const name = lang === 'ar' ? p.nameAr : p.nameEn;
    const rawDesc = lang === 'ar' ? p.descriptionAr : p.descriptionEn;
    const description = rawDesc ? rawDesc.slice(0, 160) : `${name} — Bio NL Pharmaceuticals`;

    this.titleService.setTitle(`${name} | Bio NL Pharmaceuticals`);
    this.metaService.updateTag({ name: 'description', content: description });
    this.metaService.updateTag({ property: 'og:title', content: `${name} | Bio NL Pharmaceuticals` });
    this.metaService.updateTag({ property: 'og:description', content: description });
    this.metaService.updateTag({ property: 'og:image', content: p.coverImageUrl });
  }

  private setNotFoundMeta(): void {
    const title = this.isAr() === 'ar'
      ? 'المنتج غير موجود | Bio NL Pharmaceuticals'
      : 'Product Not Found | Bio NL Pharmaceuticals';
    this.titleService.setTitle(title);
    this.metaService.updateTag({ name: 'robots', content: 'noindex' });
  }

  // ── Related products ────────────────────────────────────────────────────────

  private loadRelated(p: PublicProduct): void {
    if (p.categories.length === 0) return;

    // Use the first category to find related products
    const firstCategoryId = p.categories[0].id;

    this.productsService.loadRelatedProducts(firstCategoryId, p.slug, 4)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          const filtered = (res.data ?? [])
            .filter(related => related.slug !== p.slug)
            .slice(0, 4);
          this.relatedProducts.set(filtered);
        },
        error: () => {
          // Related products are non-critical — silently ignore errors
          this.relatedProducts.set([]);
        }
      });
  }
}
