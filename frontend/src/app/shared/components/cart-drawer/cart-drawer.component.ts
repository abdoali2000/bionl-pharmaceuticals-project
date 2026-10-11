import {
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';

import { CartService } from '../../../core/services/cart.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  styles: [`
    /* ── Overlay ──────────────────────────────────────────────────────────────── */
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      justify-content: flex-end;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    /* ── Drawer panel ─────────────────────────────────────────────────────────── */
    .drawer {
      background: #ffffff;
      width: min(420px, 100vw);
      height: 100%;
      display: flex;
      flex-direction: column;
      animation: slideIn 0.3s ease;
      box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
    }

    @keyframes slideIn {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }

    [dir='rtl'] .drawer { animation-name: slideInRtl; }
    @keyframes slideInRtl {
      from { transform: translateX(-100%); }
      to   { transform: translateX(0); }
    }

    /* ── Header ──────────────────────────────────────────────────────────────── */
    .drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.125rem 1.25rem;
      border-bottom: 1px solid #e2e8f0;
      flex-shrink: 0;
    }

    .drawer-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .item-badge {
      background: #6366f1;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      border-radius: 999px;
      padding: 0.15rem 0.5rem;
      min-width: 1.5rem;
      text-align: center;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      color: #64748b;
      font-size: 1.25rem;
      line-height: 1;
      transition: background 0.15s, color 0.15s;
    }

    .close-btn:hover { background: #f1f5f9; color: #1e293b; }

    /* ── Body: item list ─────────────────────────────────────────────────────── */
    .drawer-body {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .cart-item {
      display: flex;
      gap: 0.875rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .item-image {
      width: 72px;
      height: 72px;
      border-radius: 0.625rem;
      object-fit: cover;
      flex-shrink: 0;
      background: #f8fafc;
    }

    .item-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .item-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .item-price {
      font-size: 0.875rem;
      color: #6366f1;
      font-weight: 700;
    }

    .qty-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.25rem;
    }

    .qty-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.15s, background 0.15s, color 0.15s;
      line-height: 1;
      padding: 0;
    }

    .qty-btn:hover { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,0.06); }

    .qty-value {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #1e293b;
      min-width: 1.5rem;
      text-align: center;
    }

    .remove-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #94a3b8;
      font-size: 1rem;
      padding: 0.25rem;
      border-radius: 0.375rem;
      margin-inline-start: auto;
      transition: color 0.15s;
      align-self: flex-start;
    }

    .remove-btn:hover { color: #ef4444; }

    /* ── Empty state ─────────────────────────────────────────────────────────── */
    .empty-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      color: #94a3b8;
      padding: 2rem;
      text-align: center;
    }

    .empty-icon { font-size: 3rem; }

    .empty-text {
      font-size: 1rem;
      font-weight: 500;
      color: #64748b;
    }

    /* ── Footer ──────────────────────────────────────────────────────────────── */
    .drawer-footer {
      padding: 1.125rem 1.25rem;
      border-top: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      flex-shrink: 0;
    }

    .subtotal-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .subtotal-label {
      font-size: 0.9375rem;
      color: #475569;
      font-weight: 500;
    }

    .subtotal-value {
      font-size: 1.125rem;
      font-weight: 800;
      color: #1e293b;
    }

    .checkout-btn {
      display: block;
      width: 100%;
      padding: 0.875rem 1rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #ffffff;
      border: none;
      border-radius: 0.75rem;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      text-align: center;
      text-decoration: none;
      transition: opacity 0.2s, transform 0.15s;
      letter-spacing: 0.01em;
    }

    .checkout-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }

    .checkout-btn:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
      transform: none;
    }
  `],
  template: `
    @if (isOpen()) {
      <div
        class="overlay"
        (click)="onOverlayClick($event)"
        id="cart-drawer-overlay"
        [attr.dir]="isAr() === 'ar' ? 'rtl' : 'ltr'"
      >
        <div class="drawer" role="dialog" aria-modal="true" [attr.aria-label]="isAr() === 'ar' ? 'سلة التسوق' : 'Shopping Cart'">

          <!-- Header -->
          <div class="drawer-header">
            <h2 class="drawer-title">
              <i class="pi pi-shopping-cart"></i>
              {{ isAr() === 'ar' ? 'سلة التسوق' : 'My Cart' }}
              @if (cartService.totalItems() > 0) {
                <span class="item-badge">{{ cartService.totalItems() }}</span>
              }
            </h2>
            <button class="close-btn" (click)="close()" id="cart-close-btn" aria-label="Close cart">
              <i class="pi pi-times"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="drawer-body">
            @if (cartService.cartItems().length === 0) {
              <div class="empty-state">
                <span class="empty-icon">🛒</span>
                <p class="empty-text">
                  {{ isAr() === 'ar' ? 'السلة فارغة' : 'Your cart is empty' }}
                </p>
              </div>
            } @else {
              @for (item of cartService.cartItems(); track item.productId) {
                <div class="cart-item">
                  <img
                    class="item-image"
                    [src]="item.coverImageUrl"
                    [alt]="isAr() === 'ar' ? item.productNameAr : item.productNameEn"
                    loading="lazy"
                  />
                  <div class="item-info">
                    <p class="item-name">
                      {{ isAr() === 'ar' ? item.productNameAr : item.productNameEn }}
                    </p>
                    <p class="item-price">
                      {{ item.price | currency : 'EGP' : 'symbol-narrow' : '1.0-2' }}
                    </p>
                    <div class="qty-row">
                      <button
                        class="qty-btn"
                        (click)="decrement(item.productId, item.quantity)"
                        [attr.aria-label]="isAr() === 'ar' ? 'تقليل الكمية' : 'Decrease quantity'"
                      >−</button>
                      <span class="qty-value">{{ item.quantity }}</span>
                      <button
                        class="qty-btn"
                        (click)="cartService.updateQuantity(item.productId, item.quantity + 1)"
                        [attr.aria-label]="isAr() === 'ar' ? 'زيادة الكمية' : 'Increase quantity'"
                      >+</button>
                    </div>
                  </div>
                  <button
                    class="remove-btn"
                    (click)="cartService.removeFromCart(item.productId)"
                    [attr.aria-label]="isAr() === 'ar' ? 'حذف المنتج' : 'Remove item'"
                  >
                    <i class="pi pi-trash"></i>
                  </button>
                </div>
              }
            }
          </div>

          <!-- Footer -->
          <div class="drawer-footer">
            <div class="subtotal-row">
              <span class="subtotal-label">
                {{ isAr() === 'ar' ? 'الإجمالي' : 'Subtotal' }}
              </span>
              <span class="subtotal-value">
                {{ cartService.subtotal() | currency : 'EGP' : 'symbol-narrow' : '1.0-2' }}
              </span>
            </div>
            <button
              class="checkout-btn"
              id="proceed-to-checkout-btn"
              [disabled]="cartService.cartItems().length === 0"
              (click)="goToCheckout()"
            >
              {{ isAr() === 'ar' ? 'المتابعة للطلب ←' : 'Proceed to Checkout →' }}
            </button>
          </div>

        </div>
      </div>
    }
  `,
})
export class CartDrawerComponent {
  readonly cartService = inject(CartService);
  private langService = inject(LanguageService);
  private router = inject(Router);

  readonly isAr = this.langService.currentLang;
  readonly isOpen = signal(false);

  open(): void { this.isOpen.set(true); }
  close(): void { this.isOpen.set(false); }
  toggle(): void { this.isOpen.update(v => !v); }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('overlay')) {
      this.close();
    }
  }

  decrement(productId: string, currentQty: number): void {
    this.cartService.updateQuantity(productId, currentQty - 1);
  }

  goToCheckout(): void {
    this.close();
    this.router.navigate(['/orders/checkout']);
  }
}
