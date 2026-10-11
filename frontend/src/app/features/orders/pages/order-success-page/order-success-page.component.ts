import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-order-success-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    :host {
      display: block;
      background: #f8fafc;
      min-height: 100vh;
    }

    .wrapper {
      max-width: 520px;
      margin: 0 auto;
      padding: 3rem 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 1.5rem;
    }

    /* ── Checkmark animation ─────────────────────────────────────────────────── */
    .success-icon-wrap {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 0 12px rgba(34,197,94,0.12);
      animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes popIn {
      from { transform: scale(0.4); opacity: 0; }
      to   { transform: scale(1);   opacity: 1; }
    }

    .success-icon {
      font-size: 2.5rem;
      color: #fff;
    }

    /* ── Text ─────────────────────────────────────────────────────────────────── */
    .success-title {
      font-size: 1.625rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0;
    }

    .success-subtitle {
      font-size: 1rem;
      color: #64748b;
      line-height: 1.65;
      margin: 0;
    }

    /* ── Order ID card ────────────────────────────────────────────────────────── */
    .order-id-card {
      background: #fff;
      border-radius: 1rem;
      padding: 1.25rem 1.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07);
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
    }

    .order-id-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .order-id-value {
      font-size: 1rem;
      font-weight: 700;
      color: #6366f1;
      word-break: break-all;
      font-family: 'Courier New', monospace;
    }

    /* ── Info box ─────────────────────────────────────────────────────────────── */
    .info-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 0.875rem;
      padding: 1rem 1.25rem;
      font-size: 0.9rem;
      color: #1d4ed8;
      line-height: 1.6;
      text-align: start;
      width: 100%;
    }

    /* ── Actions ─────────────────────────────────────────────────────────────── */
    .actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
    }

    .btn-primary {
      display: block;
      width: 100%;
      padding: 0.9375rem 1rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      border: none;
      border-radius: 0.75rem;
      font-size: 1rem;
      font-weight: 700;
      text-decoration: none;
      text-align: center;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.15s;
    }

    .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

    .btn-secondary {
      display: block;
      width: 100%;
      padding: 0.9375rem 1rem;
      background: #f1f5f9;
      color: #475569;
      border: none;
      border-radius: 0.75rem;
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      text-align: center;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-secondary:hover { background: #e2e8f0; }
  `],
  template: `
    <div class="wrapper" [attr.dir]="isAr() === 'ar' ? 'rtl' : 'ltr'">

      <!-- Success icon -->
      <div class="success-icon-wrap" aria-hidden="true">
        <span class="success-icon">✓</span>
      </div>

      <!-- Title -->
      <h1 class="success-title">
        {{ isAr() === 'ar' ? '🎉 تم إرسال طلبك بنجاح!' : '🎉 Order Placed Successfully!' }}
      </h1>

      <!-- Subtitle -->
      <p class="success-subtitle">
        {{ isAr() === 'ar'
          ? 'شكرًا لك على طلبك. سيتواصل معك فريقنا قريبًا لتأكيد الطلب وترتيب التوصيل.'
          : 'Thank you for your order. Our team will contact you shortly to confirm and arrange delivery.' }}
      </p>

      <!-- Order ID -->
      @if (orderId()) {
        <div class="order-id-card">
          <span class="order-id-label">
            {{ isAr() === 'ar' ? 'رقم الطلب' : 'Order ID' }}
          </span>
          <span class="order-id-value" id="order-id-display">{{ orderId() }}</span>
        </div>
      }

      <!-- Info -->
      <div class="info-box">
        {{ isAr() === 'ar'
          ? 'ℹ️ سيتم مراجعة إثبات الدفع الخاص بك وتأكيد طلبك خلال فترة وجيزة. احتفظ برقم الطلب للمرجعية.'
          : 'ℹ️ Your payment proof will be reviewed and your order confirmed shortly. Keep your order ID for reference.' }}
      </div>

      <!-- Actions -->
      <div class="actions">
        <a
          class="btn-primary"
          routerLink="/products"
          id="continue-shopping-btn"
        >
          {{ isAr() === 'ar' ? 'مواصلة التسوق' : 'Continue Shopping' }}
        </a>
        <a
          class="btn-secondary"
          routerLink="/"
          id="go-home-btn"
        >
          {{ isAr() === 'ar' ? 'العودة للرئيسية' : 'Back to Home' }}
        </a>
      </div>

    </div>
  `,
})
export class OrderSuccessPageComponent implements OnInit {
  private router = inject(Router);
  private langService = inject(LanguageService);

  readonly isAr = this.langService.currentLang;
  readonly orderId = signal('');

  ngOnInit(): void {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { orderId?: string } | undefined;
    const id = state?.orderId ?? (history.state as { orderId?: string })?.orderId ?? '';
    this.orderId.set(id);
  }
}
