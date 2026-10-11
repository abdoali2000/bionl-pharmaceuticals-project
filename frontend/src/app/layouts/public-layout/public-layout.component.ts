import { Component, inject, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopBannerComponent } from '../../shared/components/top-banner/top-banner.component';
import { CartDrawerComponent } from '../../shared/components/cart-drawer/cart-drawer.component';
import { CartService } from '../../core/services/cart.service';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, TopBannerComponent, CartDrawerComponent],
  styles: [`
    /* ── Cart FAB ─────────────────────────────────────────────────────────────── */
    .cart-fab {
      position: fixed;
      bottom: 1.5rem;
      inset-inline-end: 1.5rem;
      z-index: 500;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(99,102,241,0.45);
      transition: transform 0.2s, box-shadow 0.2s;
      color: #fff;
      font-size: 1.375rem;
    }

    .cart-fab:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 20px rgba(99,102,241,0.5);
    }

    .cart-badge {
      position: absolute;
      top: -2px;
      inset-inline-end: -2px;
      background: #ef4444;
      color: #fff;
      font-size: 0.6875rem;
      font-weight: 700;
      border-radius: 999px;
      min-width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid #fff;
    }
  `],
  template: `
    <app-top-banner />
    <header>Public Header</header>
    <main>
      <router-outlet />
    </main>
    <footer>Public Footer</footer>

    <!-- ── Cart FAB ─────────────────────────────────────────────────────────── -->
    <button
      class="cart-fab"
      id="cart-fab-btn"
      (click)="cartDrawer.toggle()"
      aria-label="Open cart"
    >
      🛒
      @if (cartService.totalItems() > 0) {
        <span class="cart-badge">{{ cartService.totalItems() }}</span>
      }
    </button>

    <!-- ── Cart Drawer ──────────────────────────────────────────────────────── -->
    <app-cart-drawer #cartDrawer />
  `,
})
export class PublicLayoutComponent {
  readonly cartService = inject(CartService);
  @ViewChild(CartDrawerComponent) cartDrawer!: CartDrawerComponent;
}

