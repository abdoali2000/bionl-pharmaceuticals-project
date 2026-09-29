import { Component, inject, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// PrimeNG
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';

import { OffersService, Offer } from '../../../../offers/offers.service';
import { LanguageService } from '../../../../../core/services/language.service';

@Component({
  selector: 'app-admin-offers-list',
  standalone: true,
  imports: [
    CommonModule,
    TableModule,
    Button,
    ConfirmDialog,
    Toast,
    Tooltip,
    Skeleton,
    Tag,
  ],
  providers: [ConfirmationService, MessageService],
  styles: [`
    :host {
      display: block;
      padding: 1.5rem;
      background: #0f172a;
      min-height: 100%;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0.25rem 0 0;
    }

    .table-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.875rem;
      overflow: hidden;
    }

    .offer-thumb {
      width: 52px;
      height: 40px;
      object-fit: cover;
      border-radius: 0.375rem;
      border: 1px solid #334155;
      display: block;
    }

    .offer-thumb-placeholder {
      width: 52px;
      height: 40px;
      border-radius: 0.375rem;
      background: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      font-size: 1.125rem;
    }

    .offer-title {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .title-primary {
      font-weight: 600;
      color: #f1f5f9;
      font-size: 0.9375rem;
    }

    .title-secondary {
      font-size: 0.8125rem;
      color: #94a3b8;
    }

    .date-cell {
      font-size: 0.875rem;
      color: #cbd5e1;
      white-space: nowrap;
    }

    .banner-check {
      font-size: 1.125rem;
    }

    .actions-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .skeleton-wrap {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1rem;
      gap: 1rem;
    }

    .empty-icon { font-size: 2.5rem; }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #94a3b8;
      margin: 0;
    }

    .empty-text {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
      text-align: center;
    }
  `],
  template: `
    <p-toast />
    <p-confirm-dialog />

    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ isAr() ? 'إدارة العروض' : 'Offers Management' }}
        </h1>
        <p class="page-subtitle">
          {{ isAr()
              ? 'إجمالي: ' + offersService.adminOffers().length + ' عرض'
              : offersService.adminOffers().length + ' offers total'
          }}
        </p>
      </div>
      <p-button
        [label]="isAr() ? 'إضافة عرض' : 'New Offer'"
        icon="pi pi-plus"
        (click)="goToCreate()"
      />
    </div>

    <!-- Table card -->
    <div class="table-card">
      @if (offersService.adminLoading()) {
        <div class="skeleton-wrap">
          @for (n of [1,2,3,4,5]; track n) {
            <p-skeleton height="3.5rem" />
          }
        </div>
      } @else {
        <p-table
          [value]="offersService.adminOffers()"
          [paginator]="offersService.adminOffers().length > 10"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          sortField="startDate"
          [sortOrder]="-1"
          styleClass="p-datatable-striped p-datatable-sm"
          [tableStyle]="{ 'min-width': '58rem' }"
        >
          <ng-template #header>
            <tr>
              <th style="width:68px">{{ isAr() ? 'صورة' : 'Image' }}</th>
              <th [pSortableColumn]="isAr() ? 'titleAr' : 'titleEn'">
                {{ isAr() ? 'عنوان العرض' : 'Offer Title' }}
                <p-sort-icon [field]="isAr() ? 'titleAr' : 'titleEn'" />
              </th>
              <th pSortableColumn="startDate" style="width:130px">
                {{ isAr() ? 'تاريخ البداية' : 'Start Date' }}
                <p-sort-icon field="startDate" />
              </th>
              <th pSortableColumn="endDate" style="width:130px">
                {{ isAr() ? 'تاريخ الانتهاء' : 'End Date' }}
                <p-sort-icon field="endDate" />
              </th>
              <th style="width:90px; text-align:center">
                {{ isAr() ? 'شريط علوي' : 'Top Banner' }}
              </th>
              <th style="width:110px; text-align:center">
                {{ isAr() ? 'الحالة' : 'Status' }}
              </th>
              <th style="width:110px; text-align:center">
                {{ isAr() ? 'الإجراءات' : 'Actions' }}
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-offer>
            <tr>
              <!-- Image thumbnail -->
              <td>
                @if (offer.imageUrl) {
                  <img
                    class="offer-thumb"
                    [src]="offer.imageUrl"
                    [alt]="isAr() ? offer.titleAr : offer.titleEn"
                  />
                } @else {
                  <div class="offer-thumb-placeholder">
                    <i class="pi pi-tag"></i>
                  </div>
                }
              </td>

              <!-- Title (bilingual) -->
              <td>
                <div class="offer-title">
                  <span class="title-primary">{{ isAr() ? offer.titleAr : offer.titleEn }}</span>
                  <span class="title-secondary">{{ isAr() ? offer.titleEn : offer.titleAr }}</span>
                </div>
              </td>

              <!-- Start date -->
              <td>
                <span class="date-cell">{{ offer.startDate | date: 'd MMM yyyy' }}</span>
              </td>

              <!-- End date -->
              <td>
                <span class="date-cell">{{ offer.endDate | date: 'd MMM yyyy' }}</span>
              </td>

              <!-- Top banner flag -->
              <td style="text-align:center">
                <span class="banner-check">
                  @if (offer.showInTopBanner) {
                    <i class="pi pi-check-circle" style="color:#34d399"></i>
                  } @else {
                    <i class="pi pi-minus-circle" style="color:#475569"></i>
                  }
                </span>
              </td>

              <!-- Active status computed from current date -->
              <td style="text-align:center">
                @if (isActive(offer)) {
                  <p-tag
                    [value]="isAr() ? 'نشط' : 'Active'"
                    severity="success"
                  />
                } @else if (isPast(offer)) {
                  <p-tag
                    [value]="isAr() ? 'منتهٍ' : 'Expired'"
                    severity="secondary"
                  />
                } @else {
                  <p-tag
                    [value]="isAr() ? 'قادم' : 'Upcoming'"
                    severity="info"
                  />
                }
              </td>

              <!-- Actions -->
              <td>
                <div class="actions-cell">
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    (click)="goToEdit(offer)"
                    [pTooltip]="isAr() ? 'تعديل' : 'Edit'"
                    tooltipPosition="top"
                  />
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    (click)="confirmDelete(offer)"
                    [pTooltip]="isAr() ? 'حذف' : 'Delete'"
                    tooltipPosition="top"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="7">
                <div class="empty-state">
                  <span class="empty-icon">🏷️</span>
                  <p class="empty-title">{{ isAr() ? 'لا توجد عروض بعد' : 'No offers yet' }}</p>
                  <p class="empty-text">
                    {{ isAr()
                        ? 'أضف أول عرض باستخدام الزر أعلاه'
                        : 'Create your first offer using the button above'
                    }}
                  </p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
  `
})
export class AdminOffersListComponent implements OnInit {
  readonly offersService = inject(OffersService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private langService = inject(LanguageService);
  private router = inject(Router);

  readonly isAr = computed(() => this.langService.currentLang() === 'ar');

  ngOnInit(): void {
    this.offersService.adminLoadAll().subscribe();
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  goToCreate(): void {
    this.router.navigate(['/admin/offers/new']);
  }

  goToEdit(offer: Offer): void {
    this.router.navigate(['/admin/offers/edit', offer.id]);
  }

  // ── Status helpers ─────────────────────────────────────────────────────────

  /** Returns true when the offer's date window includes the current moment. */
  isActive(offer: Offer): boolean {
    const now = Date.now();
    return new Date(offer.startDate).getTime() <= now &&
           new Date(offer.endDate).getTime() >= now;
  }

  isPast(offer: Offer): boolean {
    return new Date(offer.endDate).getTime() < Date.now();
  }

  // ── Delete with confirmation ────────────────────────────────────────────────

  confirmDelete(offer: Offer): void {
    const titleDisplay = this.isAr() ? offer.titleAr : offer.titleEn;

    this.confirmationService.confirm({
      header: this.isAr() ? 'تأكيد الحذف' : 'Confirm Delete',
      message: this.isAr()
        ? `هل أنت متأكد من حذف "<b>${titleDisplay}</b>"؟ سيتم حذف الصورة المرتبطة ولا يمكن التراجع.`
        : `Are you sure you want to delete "<b>${titleDisplay}</b>"? The associated image will also be removed. This cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.isAr() ? 'نعم، احذف' : 'Yes, Delete',
      rejectLabel: this.isAr() ? 'إلغاء' : 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.offersService.adminDelete(offer.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.isAr() ? 'تم الحذف' : 'Deleted',
              detail: this.isAr()
                ? `تم حذف العرض "${offer.titleAr}" بنجاح`
                : `"${offer.titleEn}" deleted successfully`,
              life: 3000
            });
          },
          error: err => {
            this.messageService.add({
              severity: 'error',
              summary: this.isAr() ? 'خطأ' : 'Error',
              detail: err?.error?.message ?? (this.isAr() ? 'فشل الحذف' : 'Delete failed'),
              life: 5000
            });
          }
        });
      }
    });
  }
}
