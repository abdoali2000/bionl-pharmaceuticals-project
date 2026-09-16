import {
  Component, OnInit, OnDestroy, inject, signal, computed, DestroyRef, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  Subject, debounceTime, distinctUntilChanged, takeUntil
} from 'rxjs';

// PrimeNG
import { Skeleton } from 'primeng/skeleton';
import { Button } from 'primeng/button';
import { Tooltip } from 'primeng/tooltip';

// App
import { ProductsService, ProductsQuery } from '../../products.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ProductCardComponent } from '../../../../shared/components/product-card/product-card.component';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Skeleton,
    Button,
    Tooltip,
    ProductCardComponent,
  ],
  styles: [`
    :host {
      display: block;
      background: #f8fafc;
      min-height: 100vh;
    }

    /* ── Page header ─────────────────────────────────────────────────────────── */
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

    .total-label {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    /* ── Filter bar ──────────────────────────────────────────────────────────── */
    .filter-bar {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 0.875rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .search-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      inset-inline-start: 0.75rem;
      color: #94a3b8;
      font-size: 1rem;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 0.625rem 0.875rem 0.625rem 2.25rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.9375rem;
      background: #f8fafc;
      color: #1e293b;
      outline: none;
      transition: border-color 0.15s;
    }

    .search-input:focus {
      border-color: #6366f1;
      background: #ffffff;
    }

    /* Category chips */
    .category-chips {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
      scrollbar-width: none;
    }

    .category-chips::-webkit-scrollbar { display: none; }

    .chip {
      flex-shrink: 0;
      padding: 0.375rem 0.875rem;
      border-radius: 999px;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #475569;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      white-space: nowrap;
    }

    .chip:hover {
      border-color: #6366f1;
      color: #6366f1;
    }

    .chip.active {
      background: #6366f1;
      border-color: #6366f1;
      color: #ffffff;
    }

    /* Price range row */
    .price-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .price-input {
      flex: 1;
      padding: 0.5rem 0.75rem;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      color: #1e293b;
      background: #f8fafc;
      outline: none;
      transition: border-color 0.15s;
      min-width: 0;
    }

    .price-input:focus {
      border-color: #6366f1;
      background: #ffffff;
    }

    .price-separator {
      font-size: 0.875rem;
      color: #94a3b8;
    }

    /* ── Product grid ────────────────────────────────────────────────────────── */
    .grid-container {
      padding: 1rem;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.875rem;
    }

    @media (min-width: 640px) {
      .product-grid { grid-template-columns: repeat(3, 1fr); }
    }

    @media (min-width: 1024px) {
      .product-grid { grid-template-columns: repeat(4, 1fr); }
    }

    @media (min-width: 1280px) {
      .product-grid { grid-template-columns: repeat(5, 1fr); }
    }

    /* ── Empty state ─────────────────────────────────────────────────────────── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 1.5rem;
      gap: 1rem;
      text-align: center;
    }

    .empty-icon {
      font-size: 3rem;
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

    /* ── Error state ─────────────────────────────────────────────────────────── */
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

    .error-title {
      font-size: 1rem;
      font-weight: 600;
      color: #475569;
      margin: 0;
    }
  `],
  template: `
    <!-- Page header -->
    <div class="page-header" [attr.dir]="isAr() ? 'rtl' : 'ltr'">
      <h1 class="page-title">
        {{ isAr() ? 'منتجاتنا' : 'Our Products' }}
      </h1>
      @if (!productsService.loadingProducts()) {
        <p class="total-label">
          {{ productsService.total() }}
          {{ isAr() ? 'منتج' : (productsService.total() === 1 ? 'product' : 'products') }}
          {{ isAr() ? 'متاح' : 'found' }}
        </p>
      }
    </div>

    <!-- Filter bar -->
    <div class="filter-bar">
      <!-- Search -->
      <div class="search-wrap">
        <i class="pi pi-search search-icon"></i>
        <input
          class="search-input"
          type="search"
          [placeholder]="isAr() ? 'ابحث عن منتج...' : 'Search products...'"
          [attr.dir]="isAr() ? 'rtl' : 'ltr'"
          [ngModel]="searchInputValue()"
          (ngModelChange)="onSearchInput($event)"
          id="product-search-input"
        />
      </div>

      <!-- Category chips -->
      @if (productsService.loadingCategories()) {
        <div style="display:flex;gap:0.5rem">
          @for (n of [1,2,3,4]; track n) {
            <p-skeleton width="80px" height="30px" borderRadius="999px" />
          }
        </div>
      } @else if (productsService.categories().length > 0) {
        <div class="category-chips" role="group" [attr.aria-label]="isAr() ? 'تصفية حسب التصنيف' : 'Filter by category'">
          <!-- "All" chip -->
          <button
            class="chip"
            [class.active]="!activeCategoryId()"
            (click)="selectCategory(null)"
            type="button"
          >
            {{ isAr() ? 'الكل' : 'All' }}
          </button>

          @for (cat of productsService.categories(); track cat.id) {
            <button
              class="chip"
              [class.active]="activeCategoryId() === cat.id"
              (click)="selectCategory(cat.id)"
              type="button"
            >
              {{ isAr() ? cat.nameAr : cat.nameEn }}
            </button>
          }
        </div>
      }

      <!-- Price range -->
      <div class="price-row" [attr.dir]="isAr() ? 'rtl' : 'ltr'">
        <input
          class="price-input"
          type="number"
          [placeholder]="isAr() ? 'أدنى سعر' : 'Min price'"
          [ngModel]="minPrice()"
          (ngModelChange)="onMinPriceChange($event)"
          min="0"
          id="min-price-input"
        />
        <span class="price-separator">—</span>
        <input
          class="price-input"
          type="number"
          [placeholder]="isAr() ? 'أقصى سعر' : 'Max price'"
          [ngModel]="maxPrice()"
          (ngModelChange)="onMaxPriceChange($event)"
          min="0"
          id="max-price-input"
        />
        @if (minPrice() != null || maxPrice() != null) {
          <p-button
            icon="pi pi-times"
            [text]="true"
            [rounded]="true"
            severity="secondary"
            size="small"
            (click)="clearPriceFilter()"
            [pTooltip]="isAr() ? 'مسح فلتر السعر' : 'Clear price filter'"
          />
        }
      </div>
    </div>

    <!-- Product grid -->
    <div class="grid-container">

      <!-- Skeleton loading state -->
      @if (productsService.loadingProducts()) {
        <div class="product-grid">
          @for (n of skeletonItems; track n) {
            <div>
              <p-skeleton height="0" style="padding-top:100%;display:block;border-radius:0.75rem" />
              <p-skeleton width="60%" height="1rem" style="margin-top:0.75rem" />
              <p-skeleton width="40%" height="1rem" style="margin-top:0.5rem" />
            </div>
          }
        </div>
      }

      <!-- Error state -->
      @else if (hasError()) {
        <div class="error-state">
          <i class="pi pi-exclamation-triangle error-icon"></i>
          <p class="error-title">
            {{ isAr() ? 'حدث خطأ أثناء تحميل المنتجات' : 'Failed to load products' }}
          </p>
          <p-button
            [label]="isAr() ? 'إعادة المحاولة' : 'Try again'"
            icon="pi pi-refresh"
            (click)="retryLoad()"
          />
        </div>
      }

      <!-- Empty state -->
      @else if (productsService.products().length === 0) {
        <div class="empty-state">
          <i class="pi pi-inbox empty-icon"></i>
          <p class="empty-title">
            {{ isAr() ? 'لا توجد منتجات' : 'No products found' }}
          </p>
          <p class="empty-subtitle">
            {{ isAr()
              ? 'جرّب تغيير كلمة البحث أو الفلتر'
              : 'Try adjusting your search or filters' }}
          </p>
          @if (hasActiveFilters()) {
            <p-button
              [label]="isAr() ? 'مسح الفلاتر' : 'Clear filters'"
              severity="secondary"
              [text]="true"
              (click)="clearAllFilters()"
            />
          }
        </div>
      }

      <!-- Product grid -->
      @else {
        <div class="product-grid">
          @for (product of productsService.products(); track product.id) {
            <app-product-card [product]="product" />
          }
        </div>
      }

    </div>
  `
})
export class ProductsPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private langService = inject(LanguageService);
  private platformId = inject(PLATFORM_ID);
  readonly productsService = inject(ProductsService);

  readonly isAr = this.langService.currentLang;

  // Filter state (signals)
  readonly searchInputValue = signal<string>('');
  readonly activeCategoryId = signal<string | null>(null);
  readonly minPrice = signal<number | null>(null);
  readonly maxPrice = signal<number | null>(null);
  readonly hasError = signal(false);

  // Debounced search subject
  private readonly searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  // Computed: whether any filter is active
  readonly hasActiveFilters = computed(() =>
    !!this.searchInputValue() || !!this.activeCategoryId() ||
    this.minPrice() != null || this.maxPrice() != null
  );

  // Skeleton placeholder array (10 items)
  readonly skeletonItems = Array.from({ length: 10 }, (_, i) => i);

  ngOnInit(): void {
    // Load categories once on init
    this.productsService.loadCategories().subscribe();

    // Hydrate filter state from URL query params (SSR-compatible)
    const qp = this.route.snapshot.queryParams;
    if (qp['search'])     this.searchInputValue.set(qp['search']);
    if (qp['categoryId']) this.activeCategoryId.set(qp['categoryId']);
    if (qp['minPrice'])   this.minPrice.set(Number(qp['minPrice']));
    if (qp['maxPrice'])   this.maxPrice.set(Number(qp['maxPrice']));

    // Initial data fetch from URL state
    this.fetchProducts();

    // Debounce search — only fires after 300 ms of no typing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(value => {
      this.searchInputValue.set(value);
      this.syncUrlAndFetch();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Event handlers ──────────────────────────────────────────────────────────

  onSearchInput(value: string): void {
    // Update the visual input immediately; actual fetch is debounced
    this.searchSubject.next(value);
  }

  selectCategory(id: string | null): void {
    this.activeCategoryId.set(id);
    this.syncUrlAndFetch();
  }

  onMinPriceChange(value: number | null): void {
    this.minPrice.set(value === 0 ? null : value);
    this.syncUrlAndFetch();
  }

  onMaxPriceChange(value: number | null): void {
    this.maxPrice.set(value === 0 ? null : value);
    this.syncUrlAndFetch();
  }

  clearPriceFilter(): void {
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.syncUrlAndFetch();
  }

  clearAllFilters(): void {
    this.searchInputValue.set('');
    this.activeCategoryId.set(null);
    this.minPrice.set(null);
    this.maxPrice.set(null);
    this.syncUrlAndFetch();
  }

  retryLoad(): void {
    this.hasError.set(false);
    this.fetchProducts();
  }

  // ── URL sync & fetch ────────────────────────────────────────────────────────

  /** Push current filter state to the URL (replaces history entry, no back-stack noise). */
  private syncUrlAndFetch(): void {
    if (isPlatformBrowser(this.platformId)) {
      const qp: Record<string, string | null> = {
        search:     this.searchInputValue() || null,
        categoryId: this.activeCategoryId(),
        minPrice:   this.minPrice() != null ? String(this.minPrice()) : null,
        maxPrice:   this.maxPrice() != null ? String(this.maxPrice()) : null,
      };

      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: qp,
        queryParamsHandling: 'merge',
        replaceUrl: true
      });
    }

    this.fetchProducts();
  }

  /** Build the query and call the service. */
  private fetchProducts(): void {
    const query: ProductsQuery = {};
    if (this.searchInputValue())   query.search     = this.searchInputValue();
    if (this.activeCategoryId())   query.categoryId = this.activeCategoryId()!;
    if (this.minPrice() != null)   query.minPrice   = this.minPrice()!;
    if (this.maxPrice() != null)   query.maxPrice   = this.maxPrice()!;

    this.productsService.loadProducts(query).subscribe({
      error: () => this.hasError.set(true)
    });
  }
}
