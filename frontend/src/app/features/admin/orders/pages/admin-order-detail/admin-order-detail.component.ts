import {
  Component,
  inject,
  computed,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

// PrimeNG
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Image } from 'primeng/image';
import { Tag } from 'primeng/tag';
import { Skeleton } from 'primeng/skeleton';
import { Tooltip } from 'primeng/tooltip';

import {
  AdminOrdersService,
  Order,
  EGYPTIAN_GOVERNORATES,
} from '../../services/admin-orders.service';
import { LanguageService } from '../../../../../core/services/language.service';

@Component({
  selector: 'app-admin-order-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TableModule,
    Button,
    Image,
    Tag,
    Skeleton,
    Tooltip,
    CurrencyPipe,
    DatePipe,
  ],
  styles: [`
    :host {
      display: block;
      padding: 1.5rem;
      background: #ffffff;
      min-height: 100%;
    }

    /* ── Top Bar ─────────────────────────────────────────────────────────── */

    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .top-left {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .order-header-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: #30233f;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .order-id-badge {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 0.8125rem;
      color: #818cf8;
      background: rgba(99, 102, 241, 0.12);
      border: 1px solid rgba(99, 102, 241, 0.25);
      padding: 0.2rem 0.5rem;
      border-radius: 0.375rem;
    }

    /* ── Layout Grid ─────────────────────────────────────────────────────── */

    .content-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    /* ── Cards ───────────────────────────────────────────────────────────── */

    .card {
      background: #ffffff;
      border: 1px solid #eae2ef;
      border-radius: 0.875rem;
      overflow: hidden;
    }

    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #334155;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .card-title {
      font-size: 1.0625rem;
      font-weight: 600;
      color: #30233f;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.625rem;
    }

    .card-body {
      padding: 1.5rem;
    }

    /* ── Order Info Grid ─────────────────────────────────────────────────── */

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .info-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.025em;
      color: #64748b;
    }

    .info-value {
      font-size: 0.9375rem;
      color: #30233f;
      font-weight: 500;
      word-break: break-word;
    }

    .info-value-highlight {
      font-size: 1.25rem;
      font-weight: 700;
      color: #10b981;
    }

    .notes-box {
      margin-top: 1.25rem;
      padding: 1rem 1.25rem;
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid #eae2ef;
      border-radius: 0.5rem;
    }

    .notes-text {
      font-size: 0.875rem;
      color: #30233f;
      white-space: pre-wrap;
      margin: 0.25rem 0 0;
      line-height: 1.5;
    }

    /* ── Items Table ─────────────────────────────────────────────────────── */

    .item-names {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .item-primary-name {
      font-weight: 600;
      color: #30233f;
      font-size: 0.9375rem;
    }

    .item-secondary-name {
      font-size: 0.8125rem;
      color: #94a3b8;
    }

    .table-summary-row {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 2rem;
      padding: 1rem 1.5rem;
      background: #172033;
      border-top: 1px solid #334155;
    }

    /* ── Proofs Grid ─────────────────────────────────────────────────────── */

    .proofs-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1.25rem;
    }

    .proof-card {
      background: #ffffff;
      border: 1px solid #eae2ef;
      border-radius: 0.75rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: border-color 0.2s;
    }

    .proof-card:hover {
      border-color: #6366f1;
    }

    .proof-image-wrapper {
      position: relative;
      background: #020617;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 200px;
    }

    :host ::ng-deep .proof-thumbnail img {
      width: 100%;
      height: 200px;
      object-fit: cover;
      display: block;
      transition: transform 0.2s;
    }

    :host ::ng-deep .proof-thumbnail:hover img {
      transform: scale(1.02);
    }

    .proof-footer {
      padding: 0.75rem 1rem;
      border-top: 1px solid #1e293b;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .proof-time {
      font-size: 0.75rem;
      color: #64748b;
    }

    /* ── Loading Skeleton ────────────────────────────────────────────────── */

    .skeleton-box {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `],
  template: `
    <!-- Top Action Bar -->
    <div class="top-bar">
      <div class="top-left">
        <p-button
          [label]="isAr() ? 'العودة للطلبات' : 'Back to Orders'"
          icon="pi pi-arrow-left"
          severity="secondary"
          size="small"
          routerLink="/admin/orders"
        />

        @if (order(); as o) {
          <h1 class="order-header-title">
            <span>{{ isAr() ? 'طلب رقم' : 'Order' }}</span>
            <span class="order-id-badge">{{ o.id }}</span>
          </h1>
        }
      </div>

      @if (order(); as o) {
        <div class="flex items-center gap-2">
          <p-tag
            [value]="isAr() ? 'تم الاستلام' : 'Submitted'"
            severity="info"
            icon="pi pi-clock"
          />
          <span class="text-xs text-slate-400">
            {{ o.createdAt | date: 'dd/MM/yyyy, HH:mm' }}
          </span>
        </div>
      }
    </div>

    <!-- Error State -->
    @if (ordersService.error() && !ordersService.detailLoading()) {
      <div class="card p-8 text-center">
        <i class="pi pi-exclamation-triangle text-amber-400 text-4xl mb-3"></i>
        <h3 class="text-lg font-bold text-slate-200">
          {{ isAr() ? 'تعذر تحميل بيانات الطلب' : 'Failed to Load Order' }}
        </h3>
        <p class="text-slate-400 text-sm mt-1 mb-4">
          {{ ordersService.error() }}
        </p>
        <p-button
          [label]="isAr() ? 'العودة لقائمة الطلبات' : 'Back to Orders'"
          icon="pi pi-arrow-left"
          routerLink="/admin/orders"
        />
      </div>
    }

    <!-- Loading Skeleton -->
    @if (ordersService.detailLoading()) {
      <div class="content-grid">
        <div class="card skeleton-box">
          <p-skeleton height="2rem" width="30%" />
          <p-skeleton height="4rem" />
          <p-skeleton height="4rem" />
        </div>
        <div class="card skeleton-box">
          <p-skeleton height="2.5rem" />
          <p-skeleton height="8rem" />
        </div>
      </div>
    }

    <!-- Order Content -->
    @if (order(); as o) {
      <div class="content-grid">
        <!-- 1. Order Info Card -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <i class="pi pi-user text-indigo-400"></i>
              {{ isAr() ? 'بيانات العميل والتوصيل' : 'Customer & Delivery Info' }}
            </h2>

            <div class="flex items-center gap-3">
              @if (o.paymentMethod === 'INSTAPAY') {
                <p-tag
                  value="InstaPay"
                  severity="info"
                  icon="pi pi-bolt"
                />
              } @else if (o.paymentMethod === 'VODAFONE_CASH') {
                <p-tag
                  value="Vodafone Cash"
                  severity="danger"
                  icon="pi pi-wallet"
                />
              } @else if (o.paymentMethod === 'ORANGE_CASH') {
                <p-tag
                  value="Orange Cash"
                  severity="warn"
                  icon="pi pi-wallet"
                />
              } @else if (o.paymentMethod === 'ETISALAT_CASH') {
                <p-tag
                  value="Etisalat Cash"
                  severity="success"
                  icon="pi pi-wallet"
                />
              } @else {
                <p-tag
                  [value]="o.paymentMethod"
                  severity="secondary"
                />
              }

              <span class="info-value-highlight">
                {{ o.subtotalAmount | currency: 'EGP' : 'code' : '1.2-2' }}
              </span>
            </div>
          </div>

          <div class="card-body">
            <div class="info-grid">
              <!-- Customer Name -->
              <div class="info-item">
                <span class="info-label">{{ isAr() ? 'اسم العميل' : 'Customer Name' }}</span>
                <span class="info-value font-semibold">{{ o.customerName }}</span>
              </div>

              <!-- Phone Number -->
              <div class="info-item">
                <span class="info-label">{{ isAr() ? 'رقم الهاتف' : 'Phone Number' }}</span>
                <span class="info-value">
                  <a
                    [href]="'tel:' + o.phoneNumber"
                    class="text-indigo-400 hover:underline flex items-center gap-1.5"
                  >
                    <i class="pi pi-phone text-xs"></i>
                    {{ o.phoneNumber }}
                  </a>
                </span>
              </div>

              <!-- Email -->
              <div class="info-item">
                <span class="info-label">{{ isAr() ? 'البريد الإلكتروني' : 'Email Address' }}</span>
                <span class="info-value">
                  @if (o.email) {
                    <a [href]="'mailto:' + o.email" class="text-indigo-400 hover:underline">
                      {{ o.email }}
                    </a>
                  } @else {
                    <span class="text-slate-500">—</span>
                  }
                </span>
              </div>

              <!-- Governorate -->
              <div class="info-item">
                <span class="info-label">{{ isAr() ? 'المحافظة' : 'Governorate' }}</span>
                <span class="info-value flex items-center gap-1.5">
                  <i class="pi pi-map-marker text-slate-400 text-xs"></i>
                  {{ formatGovernorate(o.governorate) }}
                </span>
              </div>

              <!-- City / Center / Village -->
              <div class="info-item">
                <span class="info-label">{{ isAr() ? 'المركز / المدينة / القرية' : 'City / Village' }}</span>
                <span class="info-value">{{ o.cityOrCenterOrVillage }}</span>
              </div>

              <!-- Detailed Address -->
              <div class="info-item" style="grid-column: 1 / -1">
                <span class="info-label">{{ isAr() ? 'العنوان بالتفصيل' : 'Detailed Address' }}</span>
                <span class="info-value">{{ o.address }}</span>
              </div>
            </div>

            <!-- Notes if present -->
            @if (o.notes) {
              <div class="notes-box">
                <span class="info-label text-amber-400">
                  <i class="pi pi-comment mr-1"></i>
                  {{ isAr() ? 'ملاحظات العميل' : 'Customer Notes' }}
                </span>
                <p class="notes-text">{{ o.notes }}</p>
              </div>
            }
          </div>
        </div>

        <!-- 2. Items Table Card -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <i class="pi pi-list text-indigo-400"></i>
              {{ isAr() ? 'منتجات الطلب' : 'Ordered Items' }}
              <span class="text-xs text-slate-400 font-normal">
                ({{ o.items.length }} {{ isAr() ? 'منتج' : 'items' }})
              </span>
            </h2>
          </div>

          <p-table
            [value]="o.items"
            styleClass="p-datatable-striped p-datatable-sm"
            responsiveLayout="scroll"
          >
            <ng-template #header>
              <tr>
                <th style="min-width: 240px">
                  {{ isAr() ? 'المنتج' : 'Product' }}
                </th>
                <th style="min-width: 120px; text-align: right">
                  {{ isAr() ? 'سعر الوحدة' : 'Unit Price' }}
                </th>
                <th style="min-width: 90px; text-align: center">
                  {{ isAr() ? 'الكمية' : 'Quantity' }}
                </th>
                <th style="min-width: 120px; text-align: right">
                  {{ isAr() ? 'الإجمالي' : 'Total' }}
                </th>
              </tr>
            </ng-template>

            <ng-template #body let-item>
              <tr>
                <!-- Product Name -->
                <td>
                  <div class="item-names">
                    <span class="item-primary-name">
                      {{ isAr() ? item.productNameAr : item.productNameEn }}
                    </span>
                    <span class="item-secondary-name">
                      {{ isAr() ? item.productNameEn : item.productNameAr }}
                    </span>
                  </div>
                </td>

                <!-- Unit Price -->
                <td style="text-align: right">
                  <span class="text-slate-300 font-medium">
                    {{ item.unitPrice | currency: 'EGP' : 'code' : '1.2-2' }}
                  </span>
                </td>

                <!-- Quantity -->
                <td style="text-align: center">
                  <span class="inline-block px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 text-xs font-bold border border-slate-700">
                    ×{{ item.quantity }}
                  </span>
                </td>

                <!-- Total Price -->
                <td style="text-align: right">
                  <span class="font-bold text-emerald-400">
                    {{ item.totalPrice | currency: 'EGP' : 'code' : '1.2-2' }}
                  </span>
                </td>
              </tr>
            </ng-template>
          </p-table>

          <!-- Table Summary Footer -->
          <div class="table-summary-row">
            <div class="text-sm text-slate-400">
              {{ isAr() ? 'إجمالي عدد الأصناف:' : 'Total Item Count:' }}
              <strong class="text-slate-200 ml-1">{{ calculateTotalQuantity(o.items) }}</strong>
            </div>
            <div class="text-base font-bold text-slate-200 flex items-center gap-2">
              <span>{{ isAr() ? 'المجموع الكلي:' : 'Order Subtotal:' }}</span>
              <span class="text-emerald-400 text-lg">
                {{ o.subtotalAmount | currency: 'EGP' : 'code' : '1.2-2' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 3. Payment Proofs Card (Lightbox) -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <i class="pi pi-images text-indigo-400"></i>
              {{ isAr() ? 'إثباتات الدفع المحملة' : 'Payment Proofs' }}
              <span class="text-xs text-slate-400 font-normal">
                ({{ o.paymentProofs.length }} {{ isAr() ? 'إثبات' : 'proofs' }})
              </span>
            </h2>
            <span class="text-xs text-slate-400">
              <i class="pi pi-search-plus mr-1"></i>
              {{ isAr() ? 'اضغط على الصورة لتكبيرها' : 'Click image to enlarge' }}
            </span>
          </div>

          <div class="card-body">
            @if (o.paymentProofs.length === 0) {
              <div class="p-6 text-center text-slate-500">
                <i class="pi pi-image text-3xl mb-2 text-slate-600"></i>
                <p class="text-sm">
                  {{ isAr() ? 'لا توجد إثباتات دفع مرفقة بهذا الطلب.' : 'No payment proofs attached to this order.' }}
                </p>
              </div>
            } @else {
              <div class="proofs-grid">
                @for (proof of o.paymentProofs; track proof.id; let idx = $index) {
                  <div class="proof-card">
                    <div class="proof-image-wrapper">
                      <!-- PrimeNG Image with Lightbox Preview -->
                      <p-image
                        [src]="proof.imageUrl"
                        [preview]="true"
                        [alt]="'Payment Proof #' + (idx + 1)"
                        styleClass="proof-thumbnail w-full block"
                      />
                    </div>

                    <div class="proof-footer">
                      <span class="proof-time">
                        <i class="pi pi-calendar mr-1"></i>
                        {{ proof.uploadedAt | date: 'dd/MM/yyyy HH:mm' }}
                      </span>

                      <a
                        [href]="proof.imageUrl"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                        [pTooltip]="isAr() ? 'فتح في نافذة جديدة' : 'Open in new tab'"
                      >
                        <i class="pi pi-external-link"></i>
                      </a>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    }
  `
})
export class AdminOrderDetailComponent implements OnInit {
  readonly ordersService = inject(AdminOrdersService);
  readonly langService = inject(LanguageService);
  private readonly route = inject(ActivatedRoute);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isAr = () => this.langService.currentLang() === 'ar';
  readonly order = this.ordersService.selectedOrder;

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      const orderId = this.route.snapshot.paramMap.get('id');
      if (orderId) {
        this.ordersService.fetchOrderById(orderId).subscribe({
          error: (err) => console.error('Error fetching order detail:', err),
        });
      }
    }
  }

  formatGovernorate(govValue: string): string {
    const match = EGYPTIAN_GOVERNORATES.find(
      (g) => g.value.toLowerCase() === (govValue || '').toLowerCase() ||
             g.labelAr === govValue ||
             g.labelEn.toLowerCase() === (govValue || '').toLowerCase(),
    );
    if (!match) return govValue;
    return this.isAr() ? match.labelAr : match.labelEn;
  }

  calculateTotalQuantity(items: { quantity: number }[]): number {
    return (items || []).reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  }
}
