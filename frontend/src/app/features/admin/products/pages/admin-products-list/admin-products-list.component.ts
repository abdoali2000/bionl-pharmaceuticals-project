import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule, CurrencyPipe } from '@angular/common';

// PrimeNG
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AdminProductsService, AdminProduct } from '../../admin-products.service';
import { LanguageService } from '../../../../../core/services/language.service';

@Component({
  selector: 'app-admin-products-list',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
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

    .cover-thumb {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 0.375rem;
      border: 1px solid #334155;
      display: block;
    }

    .cover-placeholder {
      width: 48px;
      height: 48px;
      border-radius: 0.375rem;
      background: #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      font-size: 1.25rem;
    }

    .product-name {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .name-primary {
      font-weight: 600;
      color: #f1f5f9;
      font-size: 0.9375rem;
    }

    .name-secondary {
      font-size: 0.8125rem;
      color: #94a3b8;
    }

    .price-cell {
      font-weight: 600;
      color: #34d399;
      font-size: 0.9375rem;
    }

    .categories-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
    }

    .actions-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
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

    .skeleton-wrap {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
  `],
  template: `
    <p-toast />
    <p-confirm-dialog />

    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ isAr() ? 'إدارة المنتجات' : 'Product Management' }}
        </h1>
        <p class="page-subtitle">
          {{ isAr()
              ? 'إجمالي: ' + productsService.products().length + ' منتج'
              : productsService.products().length + ' products total'
          }}
        </p>
      </div>
      <p-button
        [label]="isAr() ? 'إضافة منتج' : 'New Product'"
        icon="pi pi-plus"
        (click)="goToCreate()"
      />
    </div>

    <!-- Table card -->
    <div class="table-card">
      @if (productsService.loading()) {
        <div class="skeleton-wrap">
          @for (n of [1,2,3,4,5]; track n) {
            <p-skeleton height="3.5rem" />
          }
        </div>
      } @else {
        <p-table
          [value]="productsService.products()"
          [paginator]="productsService.products().length > 10"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          sortField="nameEn"
          [sortOrder]="1"
          styleClass="p-datatable-striped p-datatable-sm"
          [tableStyle]="{ 'min-width': '60rem' }"
        >
          <ng-template #header>
            <tr>
              <th style="width:64px">{{ isAr() ? 'الصورة' : 'Cover' }}</th>
              <th [pSortableColumn]="isAr() ? 'nameAr' : 'nameEn'">
                {{ isAr() ? 'اسم المنتج' : 'Product Name' }}
                <p-sort-icon [field]="isAr() ? 'nameAr' : 'nameEn'" />
              </th>
              <th [pSortableColumn]="'price'" style="width:120px">
                {{ isAr() ? 'السعر' : 'Price' }}
                <p-sort-icon field="price" />
              </th>
              <th>{{ isAr() ? 'التصنيفات' : 'Categories' }}</th>
              <th style="width:120px; text-align:center">
                {{ isAr() ? 'الإجراءات' : 'Actions' }}
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-product>
            <tr>
              <!-- Cover thumbnail -->
              <td>
                @if (product.coverImageUrl) {
                  <img
                    class="cover-thumb"
                    [src]="product.coverImageUrl"
                    [alt]="isAr() ? product.nameAr : product.nameEn"
                  />
                } @else {
                  <div class="cover-placeholder">
                    <i class="pi pi-image"></i>
                  </div>
                }
              </td>

              <!-- Product name (bilingual) -->
              <td>
                <div class="product-name">
                  <span class="name-primary">{{ isAr() ? product.nameAr : product.nameEn }}</span>
                  <span class="name-secondary">{{ isAr() ? product.nameEn : product.nameAr }}</span>
                </div>
              </td>

              <!-- Price -->
              <td>
                <span class="price-cell">{{ product.price | currency:'EGP':'symbol':'1.0-2' }}</span>
              </td>

              <!-- Categories -->
              <td>
                <div class="categories-cell">
                  @if (product.categories?.length) {
                    @for (cat of product.categories; track cat.id) {
                      <p-tag
                        [value]="isAr() ? cat.nameAr : cat.nameEn"
                        severity="secondary"
                      />
                    }
                  } @else {
                    <span style="color:#64748b; font-size:0.8125rem">—</span>
                  }
                </div>
              </td>

              <!-- Actions -->
              <td>
                <div class="actions-cell">
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    (click)="goToEdit(product)"
                    [pTooltip]="isAr() ? 'تعديل' : 'Edit'"
                    tooltipPosition="top"
                  />
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    (click)="confirmDelete(product)"
                    [pTooltip]="isAr() ? 'حذف' : 'Delete'"
                    tooltipPosition="top"
                  />
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="5">
                <div class="empty-state">
                  <span class="empty-icon">📦</span>
                  <p class="empty-title">{{ isAr() ? 'لا توجد منتجات بعد' : 'No products yet' }}</p>
                  <p class="empty-text">
                    {{ isAr()
                        ? 'أضف أول منتج باستخدام الزر أعلاه'
                        : 'Create your first product using the button above'
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
export class AdminProductsListComponent implements OnInit {
  readonly productsService = inject(AdminProductsService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private langService = inject(LanguageService);
  private router = inject(Router);

  isAr = computed(() => this.langService.currentLang() === 'ar');

  ngOnInit(): void {
    this.productsService.loadAll().subscribe();
  }

  goToCreate(): void {
    this.router.navigate(['/admin/products/create']);
  }

  goToEdit(product: AdminProduct): void {
    this.router.navigate(['/admin/products', product.id, 'edit']);
  }

  confirmDelete(product: AdminProduct): void {
    const nameDisplay = this.isAr() ? product.nameAr : product.nameEn;

    this.confirmationService.confirm({
      header: this.isAr() ? 'تأكيد الحذف' : 'Confirm Delete',
      message: this.isAr()
        ? `هل أنت متأكد من حذف "<b>${nameDisplay}</b>"؟ سيتم حذف جميع الصور المرتبطة به ولا يمكن التراجع.`
        : `Are you sure you want to delete "<b>${nameDisplay}</b>"? All associated images will be removed. This cannot be undone.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: this.isAr() ? 'نعم، احذف' : 'Yes, Delete',
      rejectLabel: this.isAr() ? 'إلغاء' : 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.productsService.delete(product.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.isAr() ? 'تم الحذف' : 'Deleted',
              detail: this.isAr()
                ? `تم حذف منتج "${product.nameAr}" بنجاح`
                : `"${product.nameEn}" deleted successfully`,
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
