import { Injectable, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';

// ── Models ────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'INSTAPAY' | 'VODAFONE_CASH' | 'ORANGE_CASH' | 'ETISALAT_CASH';

export interface OrderItem {
  id: string;
  productNameAr: string;
  productNameEn: string;
  unitPrice: string | number;
  quantity: number;
  totalPrice: string | number;
  productId: string | null;
  orderId: string;
}

export interface PaymentProof {
  id: string;
  imageUrl: string;
  cloudinaryPublicId: string;
  uploadedAt: string;
  orderId: string;
}

export interface Order {
  id: string;
  customerName: string;
  phoneNumber: string;
  email: string | null;
  governorate: string;
  cityOrCenterOrVillage: string;
  address: string;
  notes: string | null;
  paymentMethod: PaymentMethod;
  subtotalAmount: string | number;
  createdAt: string;
  items: OrderItem[];
  paymentProofs: PaymentProof[];
}

export interface OrdersMeta {
  total: number;
}

export interface OrdersApiResponse {
  message: string;
  data: Order[];
  meta: OrdersMeta;
}

export interface SingleOrderApiResponse {
  message: string;
  data: Order;
  meta: null;
}

export interface OrderFilters {
  customerName?: string | null;
  governorate?: string | null;
  paymentMethod?: PaymentMethod | null;
  dateFrom?: Date | string | null;
  dateTo?: Date | string | null;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

// ── Egyptian Governorates ──────────────────────────────────────────────────────

export interface GovernorateItem {
  value: string;
  labelAr: string;
  labelEn: string;
  searchLabel: string;
}

export const EGYPTIAN_GOVERNORATES: GovernorateItem[] = [
  { value: 'Cairo', labelAr: 'القاهرة', labelEn: 'Cairo', searchLabel: 'القاهرة Cairo' },
  { value: 'Giza', labelAr: 'الجيزة', labelEn: 'Giza', searchLabel: 'الجيزة Giza' },
  { value: 'Alexandria', labelAr: 'الإسكندرية', labelEn: 'Alexandria', searchLabel: 'الإسكندرية Alexandria' },
  { value: 'Dakahlia', labelAr: 'الدقهلية', labelEn: 'Dakahlia', searchLabel: 'الدقهلية Dakahlia' },
  { value: 'Red Sea', labelAr: 'البحر الأحمر', labelEn: 'Red Sea', searchLabel: 'البحر الأحمر Red Sea' },
  { value: 'Beheira', labelAr: 'البحيرة', labelEn: 'Beheira', searchLabel: 'البحيرة Beheira' },
  { value: 'Faiyum', labelAr: 'الفيوم', labelEn: 'Faiyum', searchLabel: 'الفيوم Faiyum' },
  { value: 'Gharbia', labelAr: 'الغربية', labelEn: 'Gharbia', searchLabel: 'الغربية Gharbia' },
  { value: 'Ismailia', labelAr: 'الإسماعيلية', labelEn: 'Ismailia', searchLabel: 'الإسماعيلية Ismailia' },
  { value: 'Menofia', labelAr: 'المنوفية', labelEn: 'Menofia', searchLabel: 'المنوفية Menofia Menoufia' },
  { value: 'Minya', labelAr: 'المنيا', labelEn: 'Minya', searchLabel: 'المنيا Minya' },
  { value: 'Qaliubiya', labelAr: 'القليوبية', labelEn: 'Qaliubiya', searchLabel: 'القليوبية Qaliubiya Qalyubia' },
  { value: 'New Valley', labelAr: 'الوادي الجديد', labelEn: 'New Valley', searchLabel: 'الوادي الجديد New Valley' },
  { value: 'Suez', labelAr: 'السويس', labelEn: 'Suez', searchLabel: 'السويس Suez' },
  { value: 'Aswan', labelAr: 'أسوان', labelEn: 'Aswan', searchLabel: 'أسوان Aswan' },
  { value: 'Assiut', labelAr: 'أسيوط', labelEn: 'Assiut', searchLabel: 'أسيوط Assiut Asyut' },
  { value: 'Beni Suef', labelAr: 'بني سويف', labelEn: 'Beni Suef', searchLabel: 'بني سويف Beni Suef' },
  { value: 'Port Said', labelAr: 'بورسعيد', labelEn: 'Port Said', searchLabel: 'بورسعيد Port Said' },
  { value: 'Damietta', labelAr: 'دمياط', labelEn: 'Damietta', searchLabel: 'دمياط Damietta' },
  { value: 'Sharkia', labelAr: 'الشرقية', labelEn: 'Sharkia', searchLabel: 'الشرقية Sharkia Sharqia' },
  { value: 'South Sinai', labelAr: 'جنوب سيناء', labelEn: 'South Sinai', searchLabel: 'جنوب سيناء South Sinai' },
  { value: 'Kafr El Sheikh', labelAr: 'كفر الشيخ', labelEn: 'Kafr El Sheikh', searchLabel: 'كفر الشيخ Kafr El Sheikh Kafr el-Sheikh' },
  { value: 'Matrouh', labelAr: 'مطروح', labelEn: 'Matrouh', searchLabel: 'مطروح Matrouh' },
  { value: 'Luxor', labelAr: 'الأقصر', labelEn: 'Luxor', searchLabel: 'الأقصر Luxor' },
  { value: 'Qena', labelAr: 'قنا', labelEn: 'Qena', searchLabel: 'قنا Qena' },
  { value: 'North Sinai', labelAr: 'شمال سيناء', labelEn: 'North Sinai', searchLabel: 'شمال سيناء North Sinai العريش' },
  { value: 'Sohag', labelAr: 'سوهاج', labelEn: 'Sohag', searchLabel: 'سوهاج Sohag' },
];

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; labelAr: string; labelEn: string }[] = [
  { value: 'INSTAPAY', labelAr: 'انستاباي (InstaPay)', labelEn: 'InstaPay' },
  { value: 'VODAFONE_CASH', labelAr: 'فودافون كاش (Vodafone Cash)', labelEn: 'Vodafone Cash' },
  { value: 'ORANGE_CASH', labelAr: 'أورنج كاش (Orange Cash)', labelEn: 'Orange Cash' },
  { value: 'ETISALAT_CASH', labelAr: 'اتصالات كاش (Etisalat Cash)', labelEn: 'Etisalat Cash' },
];

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private readonly api = inject(ApiService);

  // ── Reactive Signals ────────────────────────────────────────────────────────
  readonly orders = signal<Order[]>([]);
  readonly totalOrders = signal<number>(0);
  readonly loading = signal<boolean>(false);
  readonly selectedOrder = signal<Order | null>(null);
  readonly detailLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  /**
   * Fetch all orders with optional filters.
   * Calls GET /api/admin/orders
   */
  fetchOrders(filters?: OrderFilters): Observable<OrdersApiResponse> {
    this.loading.set(true);
    this.error.set(null);

    let params = new HttpParams();

    if (filters) {
      if (filters.customerName && filters.customerName.trim()) {
        params = params.set('customerName', filters.customerName.trim());
      }
      if (filters.governorate) {
        params = params.set('governorate', filters.governorate);
      }
      if (filters.paymentMethod) {
        params = params.set('paymentMethod', filters.paymentMethod);
      }
      if (filters.dateFrom) {
        const fromDate = typeof filters.dateFrom === 'string'
          ? new Date(filters.dateFrom)
          : filters.dateFrom;
        if (!isNaN(fromDate.getTime())) {
          // Set to beginning of that date in local time converted to ISO
          const start = new Date(fromDate);
          start.setHours(0, 0, 0, 0);
          params = params.set('dateFrom', start.toISOString());
        }
      }
      if (filters.dateTo) {
        const toDate = typeof filters.dateTo === 'string'
          ? new Date(filters.dateTo)
          : filters.dateTo;
        if (!isNaN(toDate.getTime())) {
          // Set to end of that date in local time converted to ISO
          const end = new Date(toDate);
          end.setHours(23, 59, 59, 999);
          params = params.set('dateTo', end.toISOString());
        }
      }
    }

    return this.api.get<OrdersApiResponse>('/admin/orders', params).pipe(
      tap({
        next: (res) => {
          this.orders.set(res.data ?? []);
          this.totalOrders.set(res.meta?.total ?? res.data?.length ?? 0);
          this.loading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to load orders');
          this.loading.set(false);
        },
      }),
    );
  }

  /**
   * Fetch a single order by UUID with items and paymentProofs.
   * Calls GET /api/admin/orders/:id
   */
  fetchOrderById(id: string): Observable<SingleOrderApiResponse> {
    this.detailLoading.set(true);
    this.error.set(null);

    return this.api.get<SingleOrderApiResponse>(`/admin/orders/${id}`).pipe(
      tap({
        next: (res) => {
          this.selectedOrder.set(res.data);
          this.detailLoading.set(false);
        },
        error: (err) => {
          this.error.set(err?.error?.message || 'Failed to load order detail');
          this.detailLoading.set(false);
        },
      }),
    );
  }
}
