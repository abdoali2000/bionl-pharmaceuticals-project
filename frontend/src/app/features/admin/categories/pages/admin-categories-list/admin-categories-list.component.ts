import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';

// PrimeNG
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { ConfirmDialog } from 'primeng/confirmdialog';
import { Toast } from 'primeng/toast';
import { Tooltip } from 'primeng/tooltip';
import { Skeleton } from 'primeng/skeleton';
import { ConfirmationService, MessageService } from 'primeng/api';

import { CategoriesService, Category } from '../../categories.service';
import { CategoryFormComponent } from '../../components/category-form/category-form.component';
import { LanguageService } from '../../../../../core/services/language.service';

@Component({
  selector: 'app-admin-categories-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    TableModule,
    Button,
    ConfirmDialog,
    Toast,
    Tooltip,
    Skeleton,
    CategoryFormComponent,
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

    .slug-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(99,102,241,0.1);
      border: 1px solid rgba(99,102,241,0.25);
      border-radius: 0.375rem;
      padding: 0.2rem 0.6rem;
      font-size: 0.8125rem;
      font-family: monospace;
      color: #a5b4fc;
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
          {{ isAr() ? 'إدارة التصنيفات' : 'Category Management' }}
        </h1>
        <p class="page-subtitle">
          {{ isAr()
              ? 'إجمالي: ' + categoriesService.categories().length + ' تصنيف'
              : categoriesService.categories().length + ' categories total'
          }}
        </p>
      </div>
      <p-button
        [label]="isAr() ? 'إضافة تصنيف' : 'New Category'"
        icon="pi pi-plus"
        (click)="openCreate()"
      />
    </div>

    <!-- Table card -->
    <div class="table-card">
      @if (categoriesService.loading()) {
        <div class="skeleton-wrap">
          @for (n of [1,2,3,4,5]; track n) {
            <p-skeleton height="2.5rem" />
          }
        </div>
      } @else {
        <p-table
          [value]="categoriesService.categories()"
          [paginator]="categoriesService.categories().length > 10"
          [rows]="10"
          [rowsPerPageOptions]="[10, 25, 50]"
          sortField="nameEn"
          [sortOrder]="1"
          styleClass="p-datatable-striped p-datatable-sm"
          [tableStyle]="{ 'min-width': '50rem' }"
        >
          <ng-template #header>
            <tr>
              <th [pSortableColumn]="'nameAr'">
                {{ isAr() ? 'الاسم (عربي)' : 'Arabic Name' }}
                <p-sort-icon [field]="'nameAr'" />
              </th>
              <th [pSortableColumn]="'nameEn'">
                {{ isAr() ? 'الاسم (إنجليزي)' : 'English Name' }}
                <p-sort-icon [field]="'nameEn'" />
              </th>
              <th>{{ isAr() ? 'الرابط' : 'Slug' }}</th>
              <th [pSortableColumn]="'createdAt'">
                {{ isAr() ? 'تاريخ الإنشاء' : 'Created' }}
                <p-sort-icon [field]="'createdAt'" />
              </th>
              <th style="width:120px; text-align:center">
                {{ isAr() ? 'الإجراءات' : 'Actions' }}
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-cat>
            <tr>
              <td>{{ cat.nameAr }}</td>
              <td>{{ cat.nameEn }}</td>
              <td>
                <span class="slug-chip">
                  <i class="pi pi-link" style="font-size:0.75rem"></i>
                  {{ cat.slug }}
                </span>
              </td>
              <td>{{ cat.createdAt | date:'mediumDate' }}</td>
              <td>
                <div class="actions-cell">
                  <p-button
                    icon="pi pi-pencil"
                    [rounded]="true"
                    [text]="true"
                    severity="info"
                    (click)="openEdit(cat)"
                    [pTooltip]="isAr() ? 'تعديل' : 'Edit'"
                    tooltipPosition="top"
                  />
                  <p-button
                    icon="pi pi-trash"
                    [rounded]="true"
                    [text]="true"
                    severity="danger"
                    (click)="confirmDelete(cat)"
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
                  <span class="empty-icon">🗂️</span>
                  <p class="empty-title">{{ isAr() ? 'لا توجد تصنيفات بعد' : 'No categories yet' }}</p>
                  <p class="empty-text">
                    {{ isAr()
                        ? 'أضف أول تصنيف باستخدام الزر أعلاه'
                        : 'Create your first category using the button above'
                    }}
                  </p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>

    <!-- Create / Edit form dialog -->
    @if (formVisible()) {
      <app-category-form
        [visible]="formVisible()"
        [editCategory]="selectedCategory()"
        [isAr]="isAr()"
        (saved)="onSaved()"
        (cancelled)="closeForm()"
      />
    }
  `
})
export class AdminCategoriesListComponent implements OnInit {
  readonly categoriesService = inject(CategoriesService);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private langService = inject(LanguageService);

  isAr = computed(() => this.langService.currentLang() === 'ar');

  formVisible = signal(false);
  selectedCategory = signal<Category | null>(null);

  ngOnInit(): void {
    this.categoriesService.loadAll().subscribe();
  }

  openCreate(): void {
    this.selectedCategory.set(null);
    this.formVisible.set(true);
  }

  openEdit(cat: Category): void {
    this.selectedCategory.set(cat);
    this.formVisible.set(true);
  }

  closeForm(): void {
    this.formVisible.set(false);
    this.selectedCategory.set(null);
  }

  onSaved(): void {
    this.closeForm();
    this.messageService.add({
      severity: 'success',
      summary: this.isAr() ? 'تم الحفظ' : 'Saved',
      detail: this.isAr() ? 'تم حفظ التصنيف بنجاح' : 'Category saved successfully',
      life: 3000
    });
  }

  confirmDelete(cat: Category): void {
    const productCount = cat._count?.products ?? 0;
    const hasProducts = productCount > 0;

    const messageEn = hasProducts
      ? `Deleting "<b>${cat.nameEn}</b>" will unlink <b>${productCount}</b> product${productCount !== 1 ? 's' : ''} (they will NOT be deleted). Continue?`
      : `Are you sure you want to delete "<b>${cat.nameEn}</b>"? This cannot be undone.`;

    const messageAr = hasProducts
      ? `حذف "${cat.nameAr}" سيؤدي إلى إلغاء ارتباط ${productCount} منتج (لن تُحذف المنتجات). هل تريد المتابعة؟`
      : `هل أنت متأكد من حذف "${cat.nameAr}"؟ لا يمكن التراجع عن هذا الإجراء.`;

    this.confirmationService.confirm({
      header: this.isAr() ? 'تأكيد الحذف' : 'Confirm Delete',
      message: this.isAr() ? messageAr : messageEn,
      icon: hasProducts ? 'pi pi-exclamation-triangle' : 'pi pi-trash',
      acceptLabel: this.isAr() ? 'نعم، احذف' : 'Yes, Delete',
      rejectLabel: this.isAr() ? 'إلغاء' : 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.categoriesService.delete(cat.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: this.isAr() ? 'تم الحذف' : 'Deleted',
              detail: this.isAr()
                ? `تم حذف تصنيف "${cat.nameAr}" بنجاح`
                : `"${cat.nameEn}" deleted successfully`,
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
