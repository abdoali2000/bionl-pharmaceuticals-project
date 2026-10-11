import {
  Injectable,
  signal,
  computed,
  effect,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CartItem {
  productId: string;
  productNameAr: string;
  productNameEn: string;
  price: number;
  quantity: number;
  coverImageUrl: string;
}

const STORAGE_KEY = 'bionl_cart';

function readCartFromSessionStorage(): CartItem[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private platformId = inject(PLATFORM_ID);

  readonly cartItems = signal<CartItem[]>(
    isPlatformBrowser(this.platformId) ? readCartFromSessionStorage() : []
  );

  readonly totalItems = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly subtotal = computed(() =>
    this.cartItems().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  constructor() {
    effect(() => {
      const items = this.cartItems();
      if (isPlatformBrowser(this.platformId)) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      }
    });
  }

  addToCart(item: Omit<CartItem, 'quantity'>): void {
    this.cartItems.update(items => {
      const existing = items.find(i => i.productId === item.productId);
      if (existing) {
        return items.map(i =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...items, { ...item, quantity: 1 }];
    });
  }

  updateQuantity(productId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }
    this.cartItems.update(items =>
      items.map(i => (i.productId === productId ? { ...i, quantity } : i))
    );
  }

  removeFromCart(productId: string): void {
    this.cartItems.update(items => items.filter(i => i.productId !== productId));
  }

  clearCart(): void {
    this.cartItems.set([]);
  }
}
