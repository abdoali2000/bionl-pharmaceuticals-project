import {
  Component,
  inject,
  computed,
  OnInit,
  DestroyRef,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';

// PrimeNG
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { Tag } from 'primeng/tag';
import { Skeleton } from 'primeng/skeleton';
import { Tooltip } from 'primeng/tooltip';

import {
  AdminOrdersService,
  Order,
  EGYPTIAN_GOVERNORATES,
  PAYMENT_METHOD_OPTIONS,
  PaymentMethod,
} from '../../services/admin-orders.service';
import { LanguageService } from '../../../../../core/services/language.service';

@Component({
  selector: 'app-admin-orders-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TableModule,
    Button,
    InputText,
    Select,
    DatePicker,
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
      background: #0f172a;
      min-height: 100%;
    }

    /* ── Header ──────────────────────────────────────────────────────────── */

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0.25rem 0 0;
    }

    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.25rem 0.625rem;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #818cf8;
      font-size: 0.8125rem;
      font-weight: 600;
    }

    /* ── Filter Card ─────────────────────────────────────────────────────── */

    .filter-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.875rem;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
    }

    .filter-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #334155;
    }

    .filter-card-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #cbd5e1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      align-items: flex-end;
    }

    .filter-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .filter-label {
      font-size: 0.8125rem;
      font-weight: 500;
      color: #94a3b8;
    }

    /* ── Table Card ──────────────────────────────────────────────────────── */

    .table-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.875rem;
      overflow: hidden;
    }

    /* Ensure table cells handle long text gracefully */
    .customer-cell {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      max-width: 200px;
    }

    .customer-name {
      font-weight: 600;
      color: #f1f5f9;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .customer-email {
      font-size: 0.75rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .phone-cell {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      color: #cbd5e1;
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .gov-cell {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      color: #e2e8f0;
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .price-cell {
      font-weight: 700;
      color: #10b981;
      font-size: 0.9375rem;
      white-space: nowrap;
    }

    .date-cell {
      font-size: 0.8125rem;
      color: #94a3b8;
      white-space: nowrap;
    }

    .action-cell {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* ── Empty & Skeleton states ─────────────────────────────────────────── */

    .empty-state {
      padding: 3.5rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .empty-icon {
      font-size: 3rem;
      color: #475569;
    }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #94a3b8;
      margin: 0;
    }

    .empty-desc {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
      max-width: 380px;
    }

    .skeleton-wrap {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `],
  template: `
    <!-- Page Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          <i class="pi pi-shopping-bag text-indigo-400"></i>
          {{ isAr() ? 'إدارة الطلبات' : 'Orders Dashboard' }}
          @if (!ordersService.loading()) {
            <span class="count-badge">
              {{ ordersService.totalOrders() }} {{ isAr() ? 'طلب' : 'orders' }}
            </span>
          }
        </h1>
        <p class="page-subtitle">
          {{ isAr()
              ? 'متابعة وفحص طلبات الشراء الواردة وإثباتات الدفع'
              : 'Review and manage incoming customer orders and payment proofs'
          }}
        </p>
      </div>

      <div class="flex items-center gap-2">
        <p-button
          [label]="isAr() ? 'تحديث' : 'Refresh'"
          icon="pi pi-refresh"
          severity="secondary"
          [loading]="ordersService.loading()"
          (onClick)="refreshOrders()"
        />
      </div>
    </div>

    <!-- Filters Panel -->
    <div class="filter-card">
      <div class="filter-card-header">
        <h2 class="filter-card-title">
          <i class="pi pi-filter text-indigo-400"></i>
          {{ isAr() ? 'تصفية الطلبات' : 'Filter Orders' }}
        </h2>
        @if (hasActiveFilters()) {
          <p-button
            [label]="isAr() ? 'إعادة تعيين الفلاتر' : 'Reset Filters'"
            icon="pi pi-filter-slash"
            [text]="true"
            size="small"
            severity="warn"
            (onClick)="resetFilters()"
          />
        }
      </div>

      <form [formGroup]="filterForm" class="filter-grid">
        <!-- Customer Name Filter -->
        <div class="filter-field">
          <label class="filter-label" for="filterCustomerName">
            {{ isAr() ? 'اسم العميل' : 'Customer Name' }}
          </label>
          <div class="p-input-icon-left w-full">
            <input
              pInputText
              id="filterCustomerName"
              formControlName="customerName"
              [placeholder]="isAr() ? 'بحث بالاسم...' : 'Search by name...'"
              class="w-full p-inputtext-sm"
            />
          </div>
        </div>

        <!-- Governorate Filter -->
        <div class="filter-field">
          <label class="filter-label" for="filterGovernorate">
            {{ isAr() ? 'المحافظة' : 'Governorate' }}
          </label>
          <p-select
            inputId="filterGovernorate"
            formControlName="governorate"
            [options]="governorateOptions"
            optionLabel="labelAr"
            optionValue="value"
            [showClear]="true"
            [filter]="true"
            filterBy="labelAr,labelEn,searchLabel"
            [filterPlaceholder]="isAr() ? 'بحث بالاسم العربي أو الإنجليزي...' : 'Search in Arabic or English...'"
            [placeholder]="isAr() ? 'جميع المحافظات' : 'All Governorates'"
            styleClass="w-full p-inputtext-sm"
          >
            <ng-template #item let-gov>
              <div class="flex items-center justify-between w-full">
                <span class="font-medium text-slate-200">{{ gov.labelAr }}</span>
                <span class="text-xs text-slate-400">({{ gov.labelEn }})</span>
              </div>
            </ng-template>
          </p-select>
        </div>

        <!-- Payment Method Filter -->
        <div class="filter-field">
          <label class="filter-label" for="filterPaymentMethod">
            {{ isAr() ? 'طريقة الدفع' : 'Payment Method' }}
          </label>
          <p-select
            inputId="filterPaymentMethod"
            formControlName="paymentMethod"
            [options]="paymentMethodOptions()"
            optionLabel="label"
            optionValue="value"
            [showClear]="true"
            [placeholder]="isAr() ? 'جميع طرق الدفع' : 'All Payment Methods'"
            styleClass="w-full p-inputtext-sm"
          />
        </div>

        <!-- Date From Filter -->
        <div class="filter-field">
          <label class="filter-label" for="filterDateFrom">
            {{ isAr() ? 'من تاريخ' : 'Date From' }}
          </label>
          <p-date-picker
            inputId="filterDateFrom"
            formControlName="dateFrom"
            dateFormat="yy-mm-dd"
            [showClear]="true"
            [showIcon]="true"
            [placeholder]="isAr() ? 'من تاريخ...' : 'From date...'"
            styleClass="w-full p-inputtext-sm"
          />
        </div>

        <!-- Date To Filter -->
        <div class="filter-field">
          <label class="filter-label" for="filterDateTo">
            {{ isAr() ? 'إلى تاريخ' : 'Date To' }}
          </label>
          <p-date-picker
            inputId="filterDateTo"
            formControlName="dateTo"
            dateFormat="yy-mm-dd"
            [showClear]="true"
            [showIcon]="true"
            [placeholder]="isAr() ? 'إلى تاريخ...' : 'To date...'"
            styleClass="w-full p-inputtext-sm"
          />
        </div>
      </form>
    </div>

    <!-- Data Table Card -->
    <div class="table-card">
      @if (ordersService.loading()) {
        <div class="skeleton-wrap">
          @for (n of [1, 2, 3, 4, 5]; track n) {
            <p-skeleton height="3.25rem" />
          }
        </div>
      } @else if (orders().length === 0) {
        <div class="empty-state">
          <i class="pi pi-inbox empty-icon"></i>
          <h3 class="empty-title">
            {{ isAr() ? 'لا توجد طلبات مطابقة' : 'No Orders Found' }}
          </h3>
          <p class="empty-desc">
            {{ isAr()
                ? 'لم يتم العثور على أي طلبات تطابق معايير البحث الحالية.'
                : 'There are no orders matching your current filter criteria.'
            }}
          </p>
          @if (hasActiveFilters()) {
            <p-button
              [label]="isAr() ? 'مسح الفلاتر' : 'Clear Filters'"
              icon="pi pi-filter-slash"
              severity="secondary"
              (onClick)="resetFilters()"
            />
          }
        </div>
      } @else {
        <p-table
          [value]="orders()"
          styleClass="p-datatable-striped p-datatable-sm"
          [tableStyle]="{ 'min-width': '62rem' }"
          responsiveLayout="scroll"
        >
          <ng-template #header>
            <tr>
              <th style="min-width: 180px">
                {{ isAr() ? 'العميل' : 'Customer' }}
              </th>
              <th style="min-width: 130px">
                {{ isAr() ? 'رقم الهاتف' : 'Phone' }}
              </th>
              <th style="min-width: 130px">
                {{ isAr() ? 'المحافظة' : 'Governorate' }}
              </th>
              <th style="min-width: 140px">
                {{ isAr() ? 'طريقة الدفع' : 'Payment Method' }}
              </th>
              <th style="min-width: 120px">
                {{ isAr() ? 'الإجمالي' : 'Subtotal' }}
              </th>
              <th style="min-width: 150px">
                {{ isAr() ? 'التاريخ' : 'Date' }}
              </th>
              <th style="width: 100px; text-align: center">
                {{ isAr() ? 'الإجراءات' : 'Action' }}
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-order>
            <tr>
              <!-- Customer Name -->
              <td>
                <div class="customer-cell">
                  <span class="customer-name" [title]="order.customerName">
                    {{ order.customerName }}
                  </span>
                  @if (order.email) {
                    <span class="customer-email" [title]="order.email">
                      {{ order.email }}
                    </span>
                  }
                </div>
              </td>

              <!-- Phone -->
              <td>
                <span class="phone-cell">
                  <a
                    [href]="'tel:' + order.phoneNumber"
                    class="hover:underline text-indigo-400"
                  >
                    {{ order.phoneNumber }}
                  </a>
                </span>
              </td>

              <!-- Governorate -->
              <td>
                <div class="gov-cell">
                  <i class="pi pi-map-marker text-slate-400"></i>
                  <span>{{ formatGovernorate(order.governorate) }}</span>
                </div>
              </td>

              <!-- Payment Method -->
              <td>
                @if (order.paymentMethod === 'INSTAPAY') {
                  <p-tag
                    value="InstaPay"
                    severity="info"
                    icon="pi pi-bolt"
                  />
                } @else if (order.paymentMethod === 'VODAFONE_CASH') {
                  <p-tag
                    value="Vodafone Cash"
                    severity="danger"
                    icon="pi pi-wallet"
                  />
                } @else if (order.paymentMethod === 'ORANGE_CASH') {
                  <p-tag
                    value="Orange Cash"
                    severity="warn"
                    icon="pi pi-wallet"
                  />
                } @else if (order.paymentMethod === 'ETISALAT_CASH') {
                  <p-tag
                    value="Etisalat Cash"
                    severity="success"
                    icon="pi pi-wallet"
                  />
                } @else {
                  <p-tag
                    [value]="order.paymentMethod"
                    severity="secondary"
                  />
                }
              </td>

              <!-- Subtotal -->
              <td>
                <span class="price-cell">
                  {{ order.subtotalAmount | currency: 'EGP' : 'code' : '1.2-2' }}
                </span>
              </td>

              <!-- Date -->
              <td>
                <span class="date-cell">
                  {{ order.createdAt | date: 'dd/MM/yyyy, HH:mm' }}
                </span>
              </td>

              <!-- Action Column -->
              <td style="text-align: center">
                <div class="action-cell">
                  <p-button
                    icon="pi pi-arrow-right"
                    [pTooltip]="isAr() ? 'عرض تفاصيل الطلب' : 'View Order Details'"
                    tooltipPosition="top"
                    [rounded]="true"
                    severity="primary"
                    size="small"
                    (onClick)="viewOrderDetail(order.id)"
                  />
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
  `
})
export class AdminOrdersListComponent implements OnInit {
  readonly ordersService = inject(AdminOrdersService);
  readonly langService = inject(LanguageService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isAr = () => this.langService.currentLang() === 'ar';
  readonly orders = this.ordersService.orders;

  // ── Reactive Filters Form ──────────────────────────────────────────────────
  readonly filterForm = this.fb.group({
    customerName: [''],
    governorate: [null as string | null],
    paymentMethod: [null as PaymentMethod | null],
    dateFrom: [null as Date | null],
    dateTo: [null as Date | null],
  });

  // ── Options with dynamic language labels ───────────────────────────────────
  readonly governorateOptions = EGYPTIAN_GOVERNORATES;

  readonly paymentMethodOptions = computed(() => {
    const ar = this.isAr();
    return PAYMENT_METHOD_OPTIONS.map((p) => ({
      label: ar ? p.labelAr : p.labelEn,
      value: p.value,
    }));
  });

  readonly hasActiveFilters = computed(() => {
    const formVal = this.filterForm.value;
    return !!(
      (formVal.customerName && formVal.customerName.trim()) ||
      formVal.governorate ||
      formVal.paymentMethod ||
      formVal.dateFrom ||
      formVal.dateTo
    );
  });

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Initial fetch
      this.loadOrders();

      // Subscribe to filter changes with debounce for smooth search
      this.filterForm.valueChanges
        .pipe(
          debounceTime(300),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          this.loadOrders();
        });
    }
  }

  loadOrders(): void {
    const val = this.filterForm.value;
    this.ordersService
      .fetchOrders({
        customerName: val.customerName ?? undefined,
        governorate: val.governorate ?? undefined,
        paymentMethod: val.paymentMethod ?? undefined,
        dateFrom: val.dateFrom ?? undefined,
        dateTo: val.dateTo ?? undefined,
      })
      .subscribe({
        error: (err) => console.error('Error fetching orders:', err),
      });
  }

  refreshOrders(): void {
    this.loadOrders();
  }

  resetFilters(): void {
    this.filterForm.reset({
      customerName: '',
      governorate: null,
      paymentMethod: null,
      dateFrom: null,
      dateTo: null,
    });
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

  viewOrderDetail(id: string): void {
    this.router.navigate(['/admin/orders', id]);
  }
}
