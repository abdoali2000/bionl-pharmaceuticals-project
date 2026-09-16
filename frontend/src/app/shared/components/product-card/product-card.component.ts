import { Component, Input, computed, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../../core/services/language.service';
import { PublicProduct } from '../../../features/products/products.service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe],
  styles: [`
    :host { display: block; }

    .card {
      background: #ffffff;
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      text-decoration: none;
      color: inherit;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.12);
    }

    .card-image {
      position: relative;
      aspect-ratio: 1 / 1;
      overflow: hidden;
      background: #f1f5f9;
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }

    .card:hover .card-image img {
      transform: scale(1.04);
    }

    .card-body {
      padding: 0.875rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      flex: 1;
    }

    .card-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.35;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-price {
      font-size: 1rem;
      font-weight: 700;
      color: #6366f1;
      margin-top: auto;
    }

    .card-categories {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }

    .category-badge {
      font-size: 0.6875rem;
      font-weight: 500;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      background: rgba(99,102,241,0.1);
      color: #6366f1;
      border: 1px solid rgba(99,102,241,0.2);
      white-space: nowrap;
    }
  `],
  template: `
    <a
      class="card"
      [routerLink]="['/products', product.slug]"
      [attr.aria-label]="displayName()"
    >
      <!-- Cover image -->
      <div class="card-image">
        <img
          [src]="product.coverImageUrl"
          [alt]="displayName()"
          loading="lazy"
        />
      </div>

      <!-- Body -->
      <div class="card-body" [attr.dir]="isAr() ? 'rtl' : 'ltr'">
        <!-- Category badges -->
        @if (product.categories.length > 0) {
          <div class="card-categories">
            @for (cat of product.categories.slice(0, 3); track cat.id) {
              <span class="category-badge">
                {{ isAr() ? cat.nameAr : cat.nameEn }}
              </span>
            }
          </div>
        }

        <!-- Product name -->
        <p class="card-name">{{ displayName() }}</p>

        <!-- Price -->
        <p class="card-price">
          {{ product.price | currency : 'EGP' : 'symbol-narrow' : '1.0-2' }}
        </p>
      </div>
    </a>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: PublicProduct;

  private langService = inject(LanguageService);
  readonly isAr = this.langService.currentLang;

  displayName = computed(() =>
    this.isAr() === 'ar' ? this.product.nameAr : this.product.nameEn
  );
}
