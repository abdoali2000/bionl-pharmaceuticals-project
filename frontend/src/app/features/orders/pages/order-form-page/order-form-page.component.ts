import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  DestroyRef,
} from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { CartService } from '../../../../core/services/cart.service';
import { LanguageService } from '../../../../core/services/language.service';
import { ApiService } from '../../../../core/services/api.service';

// ── Validators ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

function fileValidator(control: AbstractControl): ValidationErrors | null {
  const file = control.value as File | null;
  if (!file) return null;
  if (file.size > MAX_FILE_SIZE) return { fileTooLarge: true };
  if (!ALLOWED_TYPES.includes(file.type)) return { fileInvalidType: true };
  return null;
}

// ── Egyptian governorates ─────────────────────────────────────────────────────

const GOVERNORATES_AR = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
  'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية',
  'المنيا', 'القليوبية', 'العريش / شمال سيناء', 'جنوب سيناء',
  'الوادي الجديد', 'السويس', 'أسوان', 'أسيوط', 'بني سويف',
  'بورسعيد', 'دمياط', 'الشرقية', 'قنا', 'كفر الشيخ',
  'مطروح', 'الأقصر', 'سوهاج',
];

const GOVERNORATES_EN = [
  'Cairo', 'Giza', 'Alexandria', 'Dakahlia', 'Red Sea',
  'Beheira', 'Faiyum', 'Gharbia', 'Ismailia', 'Menoufia',
  'Minya', 'Qalyubia', 'North Sinai', 'South Sinai',
  'New Valley', 'Suez', 'Aswan', 'Asyut', 'Beni Suef',
  'Port Said', 'Damietta', 'Sharqia', 'Qena', 'Kafr el-Sheikh',
  'Matrouh', 'Luxor', 'Sohag',
];

// ── Payment methods ───────────────────────────────────────────────────────────

interface PaymentMethod {
  value: string;
  labelAr: string;
  labelEn: string;
  icon: string;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  { value: 'INSTAPAY',      labelAr: 'إنستا باي',       labelEn: 'InstaPay',      icon: '💳' },
  { value: 'VODAFONE_CASH', labelAr: 'فودافون كاش',     labelEn: 'Vodafone Cash', icon: '📱' },
  { value: 'ORANGE_CASH',   labelAr: 'أورنج كاش',       labelEn: 'Orange Cash',   icon: '📱' },
  { value: 'ETISALAT_CASH', labelAr: 'اتصالات كاش',     labelEn: 'Etisalat Cash', icon: '📱' },
];

// ── Component ─────────────────────────────────────────────────────────────────

type SubmitState = 'idle' | 'loading' | 'error';

@Component({
  selector: 'app-order-form-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe],
  styles: [`
    :host {
      display: block;
      background: #f8fafc;
      min-height: 100vh;
    }

    /* ── Page wrapper ─────────────────────────────────────────────────────────── */
    .page-wrapper {
      max-width: 800px;
      margin: 0 auto;
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ── Page header ──────────────────────────────────────────────────────────── */
    .page-header {
      text-align: center;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1e293b;
      margin: 0 0 0.375rem;
    }

    .page-subtitle {
      font-size: 0.9375rem;
      color: #64748b;
      margin: 0;
    }

    /* ── Card ─────────────────────────────────────────────────────────────────── */
    .card {
      background: #fff;
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.07), 0 1px 2px rgba(0,0,0,0.05);
    }

    .card-title {
      font-size: 1.0625rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 1.25rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #f1f5f9;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* ── Cart summary ─────────────────────────────────────────────────────────── */
    .cart-summary-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .cart-summary-item:last-of-type { border-bottom: none; }

    .cart-item-img {
      width: 56px;
      height: 56px;
      border-radius: 0.5rem;
      object-fit: cover;
      background: #f1f5f9;
      flex-shrink: 0;
    }

    .cart-item-details { flex: 1; min-width: 0; }

    .cart-item-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cart-item-meta {
      font-size: 0.8125rem;
      color: #64748b;
      margin-top: 0.125rem;
    }

    .cart-item-total {
      font-size: 0.9375rem;
      font-weight: 700;
      color: #6366f1;
      flex-shrink: 0;
    }

    .subtotal-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1rem;
      padding-top: 0.75rem;
      border-top: 2px solid #e2e8f0;
    }

    .subtotal-label {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #475569;
    }

    .subtotal-value {
      font-size: 1.25rem;
      font-weight: 800;
      color: #1e293b;
    }

    /* ── Empty cart warning ───────────────────────────────────────────────────── */
    .empty-cart-warning {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 2rem 1rem;
      text-align: center;
      color: #94a3b8;
    }

    .empty-cart-icon { font-size: 2.5rem; }
    .empty-cart-text { font-size: 0.9375rem; color: #64748b; font-weight: 500; }

    .browse-link {
      display: inline-block;
      margin-top: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: #6366f1;
      color: #fff;
      border-radius: 0.625rem;
      font-size: 0.9375rem;
      font-weight: 600;
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .browse-link:hover { opacity: 0.88; }

    /* ── Form grid ────────────────────────────────────────────────────────────── */
    .form-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.125rem;
    }

    @media (min-width: 560px) {
      .form-grid { grid-template-columns: 1fr 1fr; }
      .col-full { grid-column: 1 / -1; }
    }

    /* ── Field ────────────────────────────────────────────────────────────────── */
    .field { display: flex; flex-direction: column; gap: 0.375rem; }

    .field-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .field-label .required {
      color: #ef4444;
      margin-inline-start: 0.2rem;
    }

    .field-input, .field-select, .field-textarea {
      width: 100%;
      padding: 0.75rem 0.875rem;
      border: 1.5px solid #e2e8f0;
      border-radius: 0.625rem;
      font-size: 0.9375rem;
      color: #1e293b;
      background: #f8fafc;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
      font-family: inherit;
      outline: none;
    }

    .field-input:focus, .field-select:focus, .field-textarea:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99,102,241,0.12);
      background: #fff;
    }

    .field-input.invalid, .field-select.invalid, .field-textarea.invalid {
      border-color: #ef4444;
    }

    .field-textarea { resize: vertical; min-height: 90px; }

    .field-error {
      font-size: 0.8125rem;
      color: #ef4444;
      font-weight: 500;
    }

    /* ── Payment method radio group ──────────────────────────────────────────── */
    .payment-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.75rem;
    }

    .payment-option {
      position: relative;
    }

    .payment-option input[type="radio"] {
      position: absolute;
      opacity: 0;
      width: 0;
      height: 0;
    }

    .payment-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 0.875rem 0.75rem;
      border: 2px solid #e2e8f0;
      border-radius: 0.75rem;
      cursor: pointer;
      text-align: center;
      transition: border-color 0.2s, background 0.2s;
      background: #f8fafc;
    }

    .payment-label:hover { border-color: #a5b4fc; background: #f5f3ff; }

    .payment-option input[type="radio"]:checked + .payment-label {
      border-color: #6366f1;
      background: rgba(99,102,241,0.07);
    }

    .payment-icon { font-size: 1.375rem; }

    .payment-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #374151;
    }

    /* ── File upload ──────────────────────────────────────────────────────────── */
    .file-upload-zone {
      border: 2px dashed #cbd5e1;
      border-radius: 0.75rem;
      padding: 1.5rem 1rem;
      text-align: center;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      background: #f8fafc;
    }

    .file-upload-zone:hover { border-color: #6366f1; background: #f5f3ff; }
    .file-upload-zone.has-file { border-color: #22c55e; background: #f0fdf4; }
    .file-upload-zone.file-error { border-color: #ef4444; }

    .file-upload-icon { font-size: 2rem; margin-bottom: 0.5rem; }

    .file-upload-text {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0;
    }

    .file-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: #166534;
      margin: 0.375rem 0 0;
    }

    .file-hint {
      font-size: 0.8rem;
      color: #94a3b8;
      margin: 0.375rem 0 0;
    }

    /* ── Error banner ────────────────────────────────────────────────────────── */
    .error-banner {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .error-banner-icon { font-size: 1.25rem; flex-shrink: 0; }

    .error-banner-text {
      font-size: 0.9rem;
      color: #991b1b;
      font-weight: 500;
    }

    /* ── Submit button ───────────────────────────────────────────────────────── */
    .submit-btn {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff;
      border: none;
      border-radius: 0.75rem;
      font-size: 1.0625rem;
      font-weight: 700;
      cursor: pointer;
      transition: opacity 0.2s, transform 0.15s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      letter-spacing: 0.01em;
    }

    .submit-btn:hover:not(:disabled) { opacity: 0.92; transform: translateY(-1px); }

    .submit-btn:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
      transform: none;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2.5px solid rgba(255,255,255,0.4);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `],
  template: `
    <div class="page-wrapper" [attr.dir]="isAr() === 'ar' ? 'rtl' : 'ltr'">
      @if (hasDemoProducts()) {<p class="preview-order-note" role="status">{{isAr() === 'ar' ? 'أنت تعاين تجربة الطلب بمنتجات تجريبية. الإرسال متاح للمنتجات الفعلية فقط.' : 'You are previewing checkout with sample products. Only real products can be ordered.'}}</p>}

      <!-- Page Header -->
      <div class="page-header">
        <h1 class="page-title">
          {{ isAr() === 'ar' ? 'إتمام الطلب' : 'Complete Your Order' }}
        </h1>
        <p class="page-subtitle">
          {{ isAr() === 'ar'
            ? 'أدخل بياناتك واختر طريقة الدفع لإتمام طلبك'
            : 'Enter your details and choose a payment method to complete your order' }}
        </p>
      </div>

      <!-- Cart Summary -->
      <div class="card">
        <h2 class="card-title">
          🛒 {{ isAr() === 'ar' ? 'ملخص الطلب' : 'Order Summary' }}
        </h2>

        @if (cartService.cartItems().length === 0) {
          <div class="empty-cart-warning">
            <span class="empty-cart-icon">🛒</span>
            <p class="empty-cart-text">
              {{ isAr() === 'ar' ? 'السلة فارغة. أضف منتجات أولاً.' : 'Your cart is empty. Add products first.' }}
            </p>
            <a class="browse-link" href="/products">
              {{ isAr() === 'ar' ? 'تصفح المنتجات' : 'Browse Products' }}
            </a>
          </div>
        } @else {
          @for (item of cartService.cartItems(); track item.productId) {
            <div class="cart-summary-item">
              <img
                class="cart-item-img"
                [src]="item.coverImageUrl"
                [alt]="isAr() === 'ar' ? item.productNameAr : item.productNameEn"
                loading="lazy"
              />
              <div class="cart-item-details">
                <p class="cart-item-name">
                  {{ isAr() === 'ar' ? item.productNameAr : item.productNameEn }}
                </p>
                <p class="cart-item-meta">
                  {{ item.quantity }} ×
                  {{ item.price | currency : 'EGP' : 'symbol-narrow' : '1.0-2' }}
                </p>
              </div>
              <span class="cart-item-total">
                {{ item.price * item.quantity | currency : 'EGP' : 'symbol-narrow' : '1.0-2' }}
              </span>
            </div>
          }

          <div class="subtotal-row">
            <span class="subtotal-label">
              {{ isAr() === 'ar' ? 'الإجمالي' : 'Total' }}
            </span>
            <span class="subtotal-value">
              {{ cartService.subtotal() | currency : 'EGP' : 'symbol-narrow' : '1.0-2' }}
            </span>
          </div>
        }
      </div>

      <!-- Order Form — only show when cart is not empty -->
      @if (cartService.cartItems().length > 0) {
        <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>

          <!-- ── Customer Info ─────────────────────────────────────────────── -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <h2 class="card-title">
              👤 {{ isAr() === 'ar' ? 'بيانات العميل' : 'Customer Information' }}
            </h2>
            <div class="form-grid">

              <!-- Customer Name -->
              <div class="field">
                <label class="field-label" for="customerName">
                  {{ isAr() === 'ar' ? 'الاسم الكامل' : 'Full Name' }}
                  <span class="required">*</span>
                </label>
                <input
                  id="customerName"
                  class="field-input"
                  [class.invalid]="isInvalid('customerName')"
                  type="text"
                  formControlName="customerName"
                  [attr.placeholder]="isAr() === 'ar' ? 'أدخل اسمك الكامل' : 'Enter your full name'"
                  autocomplete="name"
                />
                @if (isInvalid('customerName')) {
                  <span class="field-error">
                    {{ getFieldError('customerName') || (isAr() === 'ar' ? 'الاسم مطلوب (3 أحرف على الأقل)' : 'Name is required (min 3 characters)') }}
                  </span>
                }
              </div>

              <!-- Phone Number -->
              <div class="field">
                <label class="field-label" for="phoneNumber">
                  {{ isAr() === 'ar' ? 'رقم الهاتف' : 'Phone Number' }}
                  <span class="required">*</span>
                </label>
                <input
                  id="phoneNumber"
                  class="field-input"
                  [class.invalid]="isInvalid('phoneNumber')"
                  type="tel"
                  formControlName="phoneNumber"
                  [attr.placeholder]="isAr() === 'ar' ? '01XXXXXXXXX' : '01XXXXXXXXX'"
                  autocomplete="tel"
                  inputmode="tel"
                  dir="ltr"
                />
                @if (isInvalid('phoneNumber')) {
                  <span class="field-error">
                    {{ getFieldError('phoneNumber') || (isAr() === 'ar'
                      ? 'أدخل رقم هاتف مصري صحيح (11 رقم)'
                      : 'Enter a valid Egyptian phone number (11 digits)') }}
                  </span>
                }
              </div>

              <!-- Email (optional) -->
              <div class="field col-full">
                <label class="field-label" for="email">
                  {{ isAr() === 'ar' ? 'البريد الإلكتروني' : 'Email Address' }}
                  <span style="color:#94a3b8;font-weight:400;font-size:0.8125rem;">
                    ({{ isAr() === 'ar' ? 'اختياري' : 'optional' }})
                  </span>
                </label>
                <input
                  id="email"
                  class="field-input"
                  [class.invalid]="isInvalid('email')"
                  type="email"
                  formControlName="email"
                  [attr.placeholder]="isAr() === 'ar' ? 'example@email.com' : 'example@email.com'"
                  autocomplete="email"
                  inputmode="email"
                  dir="ltr"
                />
                @if (isInvalid('email')) {
                  <span class="field-error">
                    {{ getFieldError('email') || (isAr() === 'ar' ? 'أدخل بريدًا إلكترونيًا صحيحًا' : 'Enter a valid email address') }}
                  </span>
                }
              </div>

            </div>
          </div>

          <!-- ── Delivery Info ─────────────────────────────────────────────── -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <h2 class="card-title">
              📦 {{ isAr() === 'ar' ? 'بيانات التوصيل' : 'Delivery Information' }}
            </h2>
            <div class="form-grid">

              <!-- Governorate -->
              <div class="field">
                <label class="field-label" for="governorate">
                  {{ isAr() === 'ar' ? 'المحافظة' : 'Governorate' }}
                  <span class="required">*</span>
                </label>
                <select
                  id="governorate"
                  class="field-select"
                  [class.invalid]="isInvalid('governorate')"
                  formControlName="governorate"
                >
                  <option value="" disabled>
                    {{ isAr() === 'ar' ? 'اختر المحافظة' : 'Select governorate' }}
                  </option>
                  @for (gov of governorates(); track gov) {
                    <option [value]="gov">{{ gov }}</option>
                  }
                </select>
                @if (isInvalid('governorate')) {
                  <span class="field-error">
                    {{ getFieldError('governorate') || (isAr() === 'ar' ? 'اختر المحافظة' : 'Please select a governorate') }}
                  </span>
                }
              </div>

              <!-- City / Center / Village -->
              <div class="field">
                <label class="field-label" for="cityOrCenterOrVillage">
                  {{ isAr() === 'ar' ? 'المدينة / المركز / القرية' : 'City / Center / Village' }}
                  <span class="required">*</span>
                </label>
                <input
                  id="cityOrCenterOrVillage"
                  class="field-input"
                  [class.invalid]="isInvalid('cityOrCenterOrVillage')"
                  type="text"
                  formControlName="cityOrCenterOrVillage"
                  [attr.placeholder]="isAr() === 'ar' ? 'مثال: مدينة نصر' : 'e.g. Nasr City'"
                />
                @if (isInvalid('cityOrCenterOrVillage')) {
                  <span class="field-error">
                    {{ getFieldError('cityOrCenterOrVillage') || (isAr() === 'ar' ? 'هذا الحقل مطلوب' : 'This field is required') }}
                  </span>
                }
              </div>

              <!-- Full Address -->
              <div class="field col-full">
                <label class="field-label" for="address">
                  {{ isAr() === 'ar' ? 'العنوان بالتفصيل' : 'Full Address' }}
                  <span class="required">*</span>
                </label>
                <textarea
                  id="address"
                  class="field-textarea"
                  [class.invalid]="isInvalid('address')"
                  formControlName="address"
                  [attr.placeholder]="isAr() === 'ar'
                    ? 'الشارع، رقم المبنى، رقم الشقة...'
                    : 'Street, building number, apartment...'"
                  rows="3"
                ></textarea>
                @if (isInvalid('address')) {
                  <span class="field-error">
                    {{ getFieldError('address') || (isAr() === 'ar' ? 'أدخل عنوانك بالتفصيل' : 'Please enter your full address') }}
                  </span>
                }
              </div>

              <!-- Notes (optional) -->
              <div class="field col-full">
                <label class="field-label" for="notes">
                  {{ isAr() === 'ar' ? 'ملاحظات' : 'Notes' }}
                  <span style="color:#94a3b8;font-weight:400;font-size:0.8125rem;">
                    ({{ isAr() === 'ar' ? 'اختياري' : 'optional' }})
                  </span>
                </label>
                <textarea
                  id="notes"
                  class="field-textarea"
                  formControlName="notes"
                  [attr.placeholder]="isAr() === 'ar'
                    ? 'أي ملاحظات إضافية للتوصيل...'
                    : 'Any additional delivery notes...'"
                  rows="2"
                ></textarea>
              </div>

            </div>
          </div>

          <!-- ── Payment Method ─────────────────────────────────────────────── -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <h2 class="card-title">
              💳 {{ isAr() === 'ar' ? 'طريقة الدفع' : 'Payment Method' }}
            </h2>
            <div class="payment-grid" role="radiogroup" [attr.aria-label]="isAr() === 'ar' ? 'طريقة الدفع' : 'Payment method'">
              @for (method of paymentMethods; track method.value) {
                <div class="payment-option">
                  <input
                    type="radio"
                    [id]="'payment-' + method.value"
                    name="paymentMethod"
                    [value]="method.value"
                    formControlName="paymentMethod"
                  />
                  <label class="payment-label" [for]="'payment-' + method.value">
                    <span class="payment-icon">{{ method.icon }}</span>
                    <span class="payment-name">
                      {{ isAr() === 'ar' ? method.labelAr : method.labelEn }}
                    </span>
                  </label>
                </div>
              }
            </div>
            @if (isInvalid('paymentMethod')) {
              <span class="field-error" style="margin-top:0.625rem;display:block">
                {{ getFieldError('paymentMethod') || (isAr() === 'ar' ? 'اختر طريقة الدفع' : 'Please select a payment method') }}
              </span>
            }
          </div>

          <!-- ── Payment Proof Upload ───────────────────────────────────────── -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <h2 class="card-title">
              📎 {{ isAr() === 'ar' ? 'إثبات الدفع' : 'Payment Proof' }}
            </h2>

            <div
              class="file-upload-zone"
              [class.has-file]="selectedFile()"
              [class.file-error]="fileError()"
              (click)="fileInput.click()"
              role="button"
              tabindex="0"
              [attr.aria-label]="isAr() === 'ar' ? 'رفع إثبات الدفع' : 'Upload payment proof'"
              (keydown.enter)="fileInput.click()"
            >
              <input
                #fileInput
                type="file"
                id="paymentProof"
                accept="image/jpeg,image/png,application/pdf"
                style="display:none"
                (change)="onFileChange($event)"
              />

              <div class="file-upload-icon">{{ selectedFile() ? '✅' : '📁' }}</div>

              @if (selectedFile()) {
                <p class="file-name">{{ selectedFile()!.name }}</p>
                <p class="file-hint">
                  {{ isAr() === 'ar' ? 'انقر للتغيير' : 'Click to change' }}
                </p>
              } @else {
                <p class="file-upload-text">
                  {{ isAr() === 'ar'
                    ? 'انقر لرفع صورة / PDF إثبات الدفع'
                    : 'Click to upload payment proof (image or PDF)' }}
                </p>
                <p class="file-hint">
                  JPEG, PNG, PDF — {{ isAr() === 'ar' ? 'الحجم الأقصى 5 ميجا' : 'Max 5 MB' }}
                </p>
              }
            </div>

            @if (fileError()) {
              <span class="field-error" style="margin-top:0.625rem;display:block">
                {{ fileError() }}
              </span>
            }
            @if (showFileRequired()) {
              <span class="field-error" style="margin-top:0.625rem;display:block">
                {{ isAr() === 'ar' ? 'إثبات الدفع مطلوب' : 'Payment proof is required' }}
              </span>
            }
          </div>

          <!-- ── Error Banner ──────────────────────────────────────────────── -->
          @if (submitState() === 'error') {
            <div class="error-banner" style="margin-bottom: 1.5rem;" role="alert">
              <span class="error-banner-icon">⚠️</span>
              <p class="error-banner-text" style="white-space: pre-line; margin: 0;">{{ errorMessage() }}</p>
            </div>
          }

          <!-- ── Submit ────────────────────────────────────────────────────── -->
          <button
            type="submit"
            id="submit-order-btn"
            class="submit-btn"
            [disabled]="submitState() === 'loading' || cartService.cartItems().length === 0 || hasDemoProducts()"
          >
            @if (submitState() === 'loading') {
              <div class="spinner"></div>
              {{ isAr() === 'ar' ? 'جارٍ إرسال الطلب...' : 'Submitting...' }}
            } @else {
              {{ isAr() === 'ar' ? 'إرسال الطلب' : 'Place Order' }}
            }
          </button>

        </form>
      }

    </div>
  `,
})
export class OrderFormPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  readonly cartService = inject(CartService);
  readonly hasDemoProducts = () => this.cartService.cartItems().some(item => item.productId.startsWith('demo-'));
  readonly langService = inject(LanguageService);
  readonly isAr = this.langService.currentLang;

  // ── State signals ────────────────────────────────────────────────────────

  readonly submitState = signal<SubmitState>('idle');
  readonly errorMessage = signal('');
  readonly selectedFile = signal<File | null>(null);
  readonly fileError = signal('');
  readonly showFileRequired = signal(false);

  // ── Static data ──────────────────────────────────────────────────────────

  readonly paymentMethods = PAYMENT_METHODS;

  readonly governorates = computed(() =>
    this.isAr() === 'ar' ? GOVERNORATES_AR : GOVERNORATES_EN
  );

  // ── Form ──────────────────────────────────────────────────────────────────

  readonly form = this.fb.group({
    customerName: ['', [Validators.required, Validators.minLength(3)]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^01[0-9]{9}$/)]],
    email: ['', [Validators.email]],
    governorate: ['', [Validators.required]],
    cityOrCenterOrVillage: ['', [Validators.required, Validators.minLength(2)]],
    address: ['', [Validators.required, Validators.minLength(5)]],
    notes: [''],
    paymentMethod: ['', [Validators.required]],
  });

  get orderForm() {
    return this.form;
  }

  ngOnInit(): void {}

  // ── Helpers ───────────────────────────────────────────────────────────────

  isInvalid(name: string): boolean {
    const ctrl = this.form.get(name);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getFieldError(name: string): string | null {
    const ctrl = this.form.get(name);
    if (!ctrl || !ctrl.errors || (!ctrl.dirty && !ctrl.touched)) return null;
    return ctrl.errors['serverError'] || null;
  }

  // ── File handling ─────────────────────────────────────────────────────────

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.fileError.set('');

    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      this.fileError.set(
        this.isAr() === 'ar'
          ? 'حجم الملف يتجاوز 5 ميجابايت'
          : 'File size exceeds 5 MB'
      );
      this.selectedFile.set(null);
      input.value = '';
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      this.fileError.set(
        this.isAr() === 'ar'
          ? 'صيغة الملف غير مدعومة. استخدم JPEG أو PNG أو PDF'
          : 'Invalid file type. Use JPEG, PNG, or PDF'
      );
      this.selectedFile.set(null);
      input.value = '';
      return;
    }

    this.selectedFile.set(file);
    this.showFileRequired.set(false);
  }

  // ── Submission ────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.hasDemoProducts()) return;
    this.form.markAllAsTouched();

    if (!this.selectedFile()) {
      this.showFileRequired.set(true);
    }

    if (this.form.invalid || !this.selectedFile() || this.cartService.cartItems().length === 0) {
      return;
    }

    this.submitState.set('loading');
    this.errorMessage.set('');

    const formData = new FormData();
    const v = this.form.getRawValue();

    formData.append('customerName', v.customerName ?? '');
    formData.append('phoneNumber', v.phoneNumber ?? '');
    if (v.email) formData.append('email', v.email);
    formData.append('governorate', v.governorate ?? '');
    formData.append('cityOrCenterOrVillage', v.cityOrCenterOrVillage ?? '');
    formData.append('address', v.address ?? '');
    if (v.notes) formData.append('notes', v.notes);
    formData.append('paymentMethod', v.paymentMethod ?? '');
    formData.append('paymentProofs', this.selectedFile()!);
    formData.append(
      'items',
      JSON.stringify(
        this.cartService.cartItems().map(i => ({
          productId: i.productId,
          quantity: i.quantity,
        }))
      )
    );

    this.apiService
      .post<{ success: boolean; data: { id: string } }>('/orders', formData)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => {
          this.cartService.clearCart();
          this.router.navigate(['/orders/success'], {
            state: { orderId: res.data?.id ?? '' },
          });
        },
        error: (err: HttpErrorResponse) => {
          this.submitState.set('error');

          const errorsArray = err.error?.data?.errors;
          if (Array.isArray(errorsArray) && errorsArray.length > 0) {
            const detailedMessages: string[] = [];

            for (const item of errorsArray) {
              const msg: string = typeof item === 'string' ? item : item.message || '';
              const explicitField: string = typeof item === 'object' && item !== null
                ? (item.field || item.property || item.path || '')
                : '';

              let targetField = explicitField;
              if (!targetField) {
                const knownFields = [
                  'customerName',
                  'phoneNumber',
                  'email',
                  'governorate',
                  'cityOrCenterOrVillage',
                  'address',
                  'notes',
                  'paymentMethod',
                  'paymentProofs',
                ];
                targetField = knownFields.find(f => msg.toLowerCase().includes(f.toLowerCase())) || '';
              }

              if (targetField === 'paymentProofs') {
                this.fileError.set(msg);
              } else if (targetField && this.orderForm.get(targetField)) {
                const ctrl = this.orderForm.get(targetField)!;
                ctrl.setErrors({ serverError: msg });
                ctrl.markAsTouched();
              }

              if (msg) {
                detailedMessages.push(`• ${msg}`);
              }
            }

            if (detailedMessages.length > 0) {
              this.errorMessage.set(detailedMessages.join('\n'));
              return;
            }
          }

          if (err.error?.message && err.error.message !== 'Validation failed') {
            this.errorMessage.set(err.error.message);
          } else if (err.status === 0) {
            this.errorMessage.set(
              this.isAr() === 'ar'
                ? 'تعذّر الاتصال بالخادم. تحقق من الإنترنت وأعد المحاولة.'
                : 'Cannot reach the server. Please check your connection and try again.'
            );
          } else {
            this.errorMessage.set(
              this.isAr() === 'ar'
                ? 'حدث خطأ أثناء إرسال الطلب. يرجى التحقق من صحة البيانات والمحاولة مجددًا.'
                : 'Validation failed. Please verify your data and try again.'
            );
          }
        },
      });
  }
}
