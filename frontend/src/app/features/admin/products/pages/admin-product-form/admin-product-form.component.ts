import {
  Component, inject, signal, computed, OnInit, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReactiveFormsModule, FormBuilder, Validators, AbstractControl
} from '@angular/forms';

// PrimeNG
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { InputNumber } from 'primeng/inputnumber';
import { Toast } from 'primeng/toast';
import { Skeleton } from 'primeng/skeleton';
import { Message } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { AdminProductsService, AdminProduct, UpdateProductTextPayload } from '../../admin-products.service';
import { CategoriesService } from '../../../categories/categories.service';
import { GalleryManagerComponent } from '../../components/gallery-manager/gallery-manager.component';
import { LanguageService } from '../../../../../core/services/language.service';

@Component({
  selector: 'app-admin-product-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Button,
    InputText,
    Textarea,
    InputNumber,
    Toast,
    Skeleton,
    Message,
    Tooltip,
    GalleryManagerComponent,
  ],
  providers: [MessageService],
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
      gap: 1rem;
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
      flex: 1;
    }

    .form-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.875rem;
      padding: 1.75rem;
      margin-bottom: 1.5rem;
    }

    .card-title {
      font-size: 1rem;
      font-weight: 600;
      color: #e2e8f0;
      margin: 0 0 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .field-full { grid-column: 1 / -1; }

    label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #e2e8f0;
    }

    label .required {
      color: #f87171;
      margin-inline-start: 0.2rem;
    }

    /* p-error is PrimeNG's native validation class; keep field-error as fallback */
    .field-error, small.p-error {
      font-size: 0.8rem;
      color: #f87171;
      margin-top: 0.125rem;
      display: block;
    }

    .categories-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 0.625rem;
    }

    .category-check {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: rgba(99,102,241,0.06);
      border: 1px solid rgba(99,102,241,0.15);
      border-radius: 0.5rem;
      cursor: pointer;
      transition: border-color 0.2s, background 0.2s;
      user-select: none;
    }

    .category-check:hover {
      background: rgba(99,102,241,0.12);
      border-color: rgba(99,102,241,0.3);
    }

    .category-check.selected {
      background: rgba(99,102,241,0.18);
      border-color: rgba(99,102,241,0.5);
    }

    .check-icon {
      font-size: 1rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .check-label {
      font-size: 0.875rem;
      color: #cbd5e1;
    }


    /* Cover image section */
    .cover-preview-wrap {
      position: relative;
      display: inline-block;
    }

    .cover-preview {
      width: 160px;
      height: 160px;
      object-fit: cover;
      border-radius: 0.5rem;
      border: 1px solid #334155;
      display: block;
    }

    .cover-placeholder {
      width: 160px;
      height: 160px;
      border-radius: 0.5rem;
      background: #0f172a;
      border: 2px dashed #334155;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: #64748b;
    }

    .cover-placeholder i { font-size: 2rem; }
    .cover-placeholder span { font-size: 0.8125rem; }

    .upload-label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #6366f1;
      color: #fff;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      border: none;
      min-height: 38px;
      margin-top: 0.75rem;
    }

    .upload-label:hover { background: #4f46e5; }
    .upload-label input { display: none; }

    .file-name {
      font-size: 0.8125rem;
      color: #94a3b8;
      margin-top: 0.375rem;
    }

    .form-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .divider-label {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #94a3b8;
    }

    .section-divider {
      border: none;
      border-top: 1px solid #334155;
      margin: 1.5rem 0;
      grid-column: 1 / -1;
    }

    .cover-section-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #e2e8f0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      grid-column: 1 / -1;
    }
  `],
  template: `
    <p-toast />

    <!-- Page header -->
    <div class="page-header">
      <p-button
        icon="pi pi-arrow-left"
        [rounded]="true"
        [text]="true"
        severity="secondary"
        (click)="goBack()"
        [pTooltip]="isAr() ? 'رجوع' : 'Back'"
      />
      <h1 class="page-title">
        {{ isEditMode()
            ? (isAr() ? 'تعديل المنتج' : 'Edit Product')
            : (isAr() ? 'إضافة منتج جديد' : 'New Product')
        }}
      </h1>
    </div>

    @if (pageLoading()) {
      <div style="display:flex;flex-direction:column;gap:1rem">
        @for (n of [1,2,3]; track n) {
          <p-skeleton height="6rem" borderRadius="0.875rem" />
        }
      </div>
    } @else {

    <!-- ─── Text & Categories form card ─────────────────────────────────────── -->
    <div class="form-card">
      <h2 class="card-title">
        <i class="pi pi-file-edit"></i>
        {{ isAr() ? 'بيانات المنتج' : 'Product Details' }}
      </h2>

      @if (textServerError()) {
        <p-message severity="error" style="margin-bottom:1rem;display:block">
          {{ textServerError() }}
        </p-message>
      }

      <form [formGroup]="textForm" (ngSubmit)="submitTextForm()" class="form-grid">

        <!-- Arabic Name -->
        <div class="field">
          <label for="nameAr">
            {{ isAr() ? 'الاسم بالعربية' : 'Arabic Name' }}
            <span class="required">*</span>
          </label>
          <input
            id="nameAr"
            pInputText
            formControlName="nameAr"
            dir="rtl"
            [placeholder]="isAr() ? 'اسم المنتج بالعربية' : 'Product name in Arabic'"
            [class.ng-invalid]="isInvalid('nameAr', textForm)"
            [class.ng-dirty]="isInvalid('nameAr', textForm)"
          />
          @if (isInvalid('nameAr', textForm)) {
            @if (textForm.get('nameAr')?.errors?.['required']) {
              <small class="p-error">{{ isAr() ? 'الاسم بالعربية مطلوب' : 'Arabic name is required' }}</small>
            } @else if (textForm.get('nameAr')?.errors?.['minlength']) {
              <small class="p-error">{{ isAr() ? 'الحد الأدنى حرفان' : 'Minimum 2 characters' }}</small>
            }
          }
        </div>

        <!-- English Name -->
        <div class="field">
          <label for="nameEn">
            {{ isAr() ? 'الاسم بالإنجليزية' : 'English Name' }}
            <span class="required">*</span>
          </label>
          <input
            id="nameEn"
            pInputText
            formControlName="nameEn"
            dir="ltr"
            [placeholder]="isAr() ? 'اسم المنتج بالإنجليزية' : 'Product name in English'"
            [class.ng-invalid]="isInvalid('nameEn', textForm)"
            [class.ng-dirty]="isInvalid('nameEn', textForm)"
          />
          @if (isInvalid('nameEn', textForm)) {
            @if (textForm.get('nameEn')?.errors?.['required']) {
              <small class="p-error">{{ isAr() ? 'الاسم بالإنجليزية مطلوب' : 'English name is required' }}</small>
            } @else if (textForm.get('nameEn')?.errors?.['minlength']) {
              <small class="p-error">{{ isAr() ? 'الحد الأدنى حرفان' : 'Minimum 2 characters' }}</small>
            }
          }
        </div>

        <!-- Arabic Description -->
        <div class="field field-full">
          <label for="descriptionAr">{{ isAr() ? 'الوصف بالعربية' : 'Arabic Description' }}</label>
          <textarea
            id="descriptionAr"
            pTextarea
            formControlName="descriptionAr"
            dir="rtl"
            rows="3"
            [placeholder]="isAr() ? 'وصف المنتج بالعربية' : 'Product description in Arabic'"
            style="width:100%;resize:vertical"
            [class.ng-invalid]="isInvalid('descriptionAr', textForm)"
            [class.ng-dirty]="isInvalid('descriptionAr', textForm)"
          ></textarea>
          @if (isInvalid('descriptionAr', textForm)) {
            @if (textForm.get('descriptionAr')?.errors?.['required']) {
              <small class="p-error">{{ isAr() ? 'هذا الحقل مطلوب' : 'This field is required' }}</small>
            } @else if (textForm.get('descriptionAr')?.errors?.['minlength']) {
              <small class="p-error">{{ isAr() ? 'يجب ألا يقل عن 10 أحرف' : 'Must be at least 10 characters' }}</small>
            }
          }
        </div>

        <!-- English Description -->
        <div class="field field-full">
          <label for="descriptionEn">{{ isAr() ? 'الوصف بالإنجليزية' : 'English Description' }}</label>
          <textarea
            id="descriptionEn"
            pTextarea
            formControlName="descriptionEn"
            dir="ltr"
            rows="3"
            [placeholder]="isAr() ? 'وصف المنتج بالإنجليزية' : 'Product description in English'"
            style="width:100%;resize:vertical"
            [class.ng-invalid]="isInvalid('descriptionEn', textForm)"
            [class.ng-dirty]="isInvalid('descriptionEn', textForm)"
          ></textarea>
          @if (isInvalid('descriptionEn', textForm)) {
            @if (textForm.get('descriptionEn')?.errors?.['required']) {
              <small class="p-error">{{ isAr() ? 'هذا الحقل مطلوب' : 'This field is required' }}</small>
            } @else if (textForm.get('descriptionEn')?.errors?.['minlength']) {
              <small class="p-error">{{ isAr() ? 'يجب ألا يقل عن 10 أحرف' : 'Must be at least 10 characters' }}</small>
            }
          }
        </div>

        <!-- Arabic Ingredients -->
        <div class="field">
          <label for="ingredientsAr">{{ isAr() ? 'المكونات بالعربية' : 'Arabic Ingredients' }}</label>
          <textarea
            id="ingredientsAr"
            pTextarea
            formControlName="ingredientsAr"
            dir="rtl"
            rows="3"
            [placeholder]="isAr() ? 'مكونات المنتج' : 'Ingredients in Arabic'"
            style="width:100%;resize:vertical"
            [class.ng-invalid]="isInvalid('ingredientsAr', textForm)"
            [class.ng-dirty]="isInvalid('ingredientsAr', textForm)"
          ></textarea>
          @if (isInvalid('ingredientsAr', textForm)) {
            @if (textForm.get('ingredientsAr')?.errors?.['required']) {
              <small class="p-error">{{ isAr() ? 'هذا الحقل مطلوب' : 'This field is required' }}</small>
            } @else if (textForm.get('ingredientsAr')?.errors?.['minlength']) {
              <small class="p-error">{{ isAr() ? 'يجب ألا يقل عن 10 أحرف' : 'Must be at least 10 characters' }}</small>
            }
          }
        </div>

        <!-- English Ingredients -->
        <div class="field">
          <label for="ingredientsEn">{{ isAr() ? 'المكونات بالإنجليزية' : 'English Ingredients' }}</label>
          <textarea
            id="ingredientsEn"
            pTextarea
            formControlName="ingredientsEn"
            dir="ltr"
            rows="3"
            [placeholder]="isAr() ? 'المكونات بالإنجليزية' : 'Ingredients in English'"
            style="width:100%;resize:vertical"
            [class.ng-invalid]="isInvalid('ingredientsEn', textForm)"
            [class.ng-dirty]="isInvalid('ingredientsEn', textForm)"
          ></textarea>
          @if (isInvalid('ingredientsEn', textForm)) {
            @if (textForm.get('ingredientsEn')?.errors?.['required']) {
              <small class="p-error">{{ isAr() ? 'هذا الحقل مطلوب' : 'This field is required' }}</small>
            } @else if (textForm.get('ingredientsEn')?.errors?.['minlength']) {
              <small class="p-error">{{ isAr() ? 'يجب ألا يقل عن 10 أحرف' : 'Must be at least 10 characters' }}</small>
            }
          }
        </div>

        <!-- Arabic Usage Instructions -->
        <div class="field">
          <label for="usageInstructionsAr">{{ isAr() ? 'طريقة الاستخدام بالعربية' : 'Arabic Usage Instructions' }}</label>
          <textarea
            id="usageInstructionsAr"
            pTextarea
            formControlName="usageInstructionsAr"
            dir="rtl"
            rows="3"
            [placeholder]="isAr() ? 'طريقة الاستخدام' : 'Usage instructions in Arabic'"
            style="width:100%;resize:vertical"
            [class.ng-invalid]="isInvalid('usageInstructionsAr', textForm)"
            [class.ng-dirty]="isInvalid('usageInstructionsAr', textForm)"
          ></textarea>
          @if (isInvalid('usageInstructionsAr', textForm)) {
            @if (textForm.get('usageInstructionsAr')?.errors?.['required']) {
              <small class="p-error">{{ isAr() ? 'هذا الحقل مطلوب' : 'This field is required' }}</small>
            } @else if (textForm.get('usageInstructionsAr')?.errors?.['minlength']) {
              <small class="p-error">{{ isAr() ? 'يجب ألا يقل عن 10 أحرف' : 'Must be at least 10 characters' }}</small>
            }
          }
        </div>

        <!-- English Usage Instructions -->
        <div class="field">
          <label for="usageInstructionsEn">{{ isAr() ? 'طريقة الاستخدام بالإنجليزية' : 'English Usage Instructions' }}</label>
          <textarea
            id="usageInstructionsEn"
            pTextarea
            formControlName="usageInstructionsEn"
            dir="ltr"
            rows="3"
            [placeholder]="isAr() ? 'الاستخدام بالإنجليزية' : 'Usage instructions in English'"
            style="width:100%;resize:vertical"
            [class.ng-invalid]="isInvalid('usageInstructionsEn', textForm)"
            [class.ng-dirty]="isInvalid('usageInstructionsEn', textForm)"
          ></textarea>
          @if (isInvalid('usageInstructionsEn', textForm)) {
            @if (textForm.get('usageInstructionsEn')?.errors?.['required']) {
              <small class="p-error">{{ isAr() ? 'هذا الحقل مطلوب' : 'This field is required' }}</small>
            } @else if (textForm.get('usageInstructionsEn')?.errors?.['minlength']) {
              <small class="p-error">{{ isAr() ? 'يجب ألا يقل عن 10 أحرف' : 'Must be at least 10 characters' }}</small>
            }
          }
        </div>

        <!-- Price -->
        <div class="field">
          <label for="price">
            {{ isAr() ? 'السعر (جنيه)' : 'Price (EGP)' }}
            <span class="required">*</span>
          </label>
          <p-input-number
            inputId="price"
            formControlName="price"
            [min]="0"
            [maxFractionDigits]="2"
            [placeholder]="isAr() ? '0.00' : '0.00'"
            style="width:100%"
            [class.ng-invalid]="isInvalid('price', textForm)"
            [class.ng-dirty]="isInvalid('price', textForm)"
          />
          @if (isInvalid('price', textForm)) {
            @if (textForm.get('price')?.errors?.['required']) {
              <small class="p-error">{{ isAr() ? 'السعر مطلوب' : 'Price is required' }}</small>
            } @else if (textForm.get('price')?.errors?.['min']) {
              <small class="p-error">{{ isAr() ? 'يجب أن يكون السعر 0 أو أكثر' : 'Price must be 0 or greater' }}</small>
            }
          }
        </div>

        <!-- Spacer -->
        <div></div>

        <!-- Categories -->
        <div class="field field-full">
          <label>{{ isAr() ? 'التصنيفات' : 'Categories' }}</label>
          @if (categoriesService.loading()) {
            <p-skeleton height="2.5rem" />
          } @else if (categoriesService.categories().length === 0) {
            <span style="color:#64748b;font-size:0.875rem">
              {{ isAr() ? 'لا توجد تصنيفات. أضف تصنيفات أولاً.' : 'No categories found. Create categories first.' }}
            </span>
          } @else {
            <div class="categories-grid">
              @for (cat of categoriesService.categories(); track cat.id) {
                <div
                  class="category-check"
                  [class.selected]="isCategorySelected(cat.id)"
                  (click)="toggleCategory(cat.id)"
                  [attr.role]="'checkbox'"
                  [attr.aria-checked]="isCategorySelected(cat.id)"
                >
                  <span class="check-icon">
                    @if (isCategorySelected(cat.id)) {
                      <i class="pi pi-check-circle" style="color:#6366f1"></i>
                    } @else {
                      <i class="pi pi-circle" style="color:#475569"></i>
                    }
                  </span>
                  <span class="check-label">{{ isAr() ? cat.nameAr : cat.nameEn }}</span>
                </div>
              }
            </div>
          }
        </div>


      </form>

      <!-- ─── Cover Image (inline inside product card) ───────────────────── -->
      <hr class="section-divider" />

      <div class="cover-section-title">
        <i class="pi pi-image"></i>
        {{ isAr() ? 'صورة الغلاف' : 'Cover Image' }}
        @if (!isEditMode()) { <span class="required" style="color:#f87171">*</span> }
      </div>

      @if (coverServerError()) {
        <p-message severity="error" style="margin-bottom:1rem;display:block">
          {{ coverServerError() }}
        </p-message>
      }

      <div style="display:flex;flex-direction:column;align-items:flex-start;gap:0.75rem;margin-bottom:1.25rem">

        <!-- Preview -->
        @if (coverPreviewUrl()) {
          <div class="cover-preview-wrap">
            <img class="cover-preview" [src]="coverPreviewUrl()" alt="cover preview" />
          </div>
        } @else {
          <div class="cover-placeholder">
            <i class="pi pi-image"></i>
            <span>{{ isAr() ? 'لم تُختر صورة بعد' : 'No image selected' }}</span>
          </div>
        }

        <!-- Upload trigger -->
        <label class="upload-label">
          <i class="pi pi-upload"></i>
          {{ isEditMode()
              ? (isAr() ? 'استبدال صورة الغلاف' : 'Replace Cover Image')
              : (isAr() ? 'اختر صورة الغلاف' : 'Choose Cover Image')
          }}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            (change)="onCoverSelected($event)"
          />
        </label>

        @if (coverFileName()) {
          <span class="file-name">{{ coverFileName() }}</span>
        }

        @if (!isEditMode() && coverMissing()) {
          <small class="p-error">
            {{ isAr() ? 'صورة الغلاف مطلوبة' : 'Cover image is required' }}
          </small>
        }

        <!-- Upload button in edit mode when a new file is selected -->
        @if (isEditMode() && selectedCoverFile()) {
          <p-button
            [label]="coverSaving()
              ? (isAr() ? 'جارٍ الرفع...' : 'Uploading...')
              : (isAr() ? 'رفع الصورة الجديدة' : 'Upload New Cover')"
            icon="pi pi-upload"
            [loading]="coverSaving()"
            (click)="submitCoverReplace()"
          />
        }
      </div>

      <!-- ─── Gallery Manager (edit mode only, inside same card) ─────────── -->
      @if (isEditMode() && currentProduct()) {
        <hr class="section-divider" />
        <div class="cover-section-title">
          <i class="pi pi-images"></i>
          {{ isAr() ? 'معرض الصور' : 'Image Gallery' }}
        </div>
        <app-gallery-manager
          [productId]="currentProduct()!.id"
          [images]="currentProduct()!.images"
          (galleryChanged)="refreshProduct()"
        />
      }

      <!-- Text form submit -->
      <div class="form-actions" style="margin-top:1.5rem">
        <p-button
          [label]="isAr() ? 'إلغاء' : 'Cancel'"
          severity="secondary"
          [text]="true"
          (click)="goBack()"
        />
        <p-button
          [label]="textSaving()
            ? (isAr() ? 'جارٍ الحفظ...' : 'Saving...')
            : (isEditMode() ? (isAr() ? 'حفظ التغييرات' : 'Save Changes') : (isAr() ? 'متابعة' : 'Continue'))"
          [icon]="textSaving() ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
          [loading]="textSaving()"
          [disabled]="textSaving()"
          (click)="submitTextForm()"
        />
      </div>
    </div>

    <!-- Gallery Manager is now rendered inside the main card via the template below -->

    } <!-- end @if (!pageLoading()) -->
  `
})
export class AdminProductFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productsService = inject(AdminProductsService);
  readonly categoriesService = inject(CategoriesService);
  private messageService = inject(MessageService);
  private langService = inject(LanguageService);
  private platformId = inject(PLATFORM_ID);

  isAr = computed(() => this.langService.currentLang() === 'ar');

  // Route state
  productId = signal<string | null>(null);
  isEditMode = computed(() => !!this.productId());

  // Page state
  pageLoading = signal(false);
  currentProduct = signal<AdminProduct | null>(null);

  // Text form state
  textSaving = signal(false);
  textServerError = signal<string | null>(null);

  // Cover state
  coverSaving = signal(false);
  coverServerError = signal<string | null>(null);
  selectedCoverFile = signal<File | null>(null);
  coverPreviewUrl = signal<string | null>(null);
  coverFileName = signal<string | null>(null);
  coverMissing = signal(false);

  // Categories selection
  selectedCategoryIds = signal<Set<string>>(new Set());

  // Text form
  textForm = this.fb.group({
    nameAr: ['', [Validators.required, Validators.minLength(2)]],
    nameEn: ['', [Validators.required, Validators.minLength(2)]],
    descriptionAr: ['', [Validators.minLength(10)]],
    descriptionEn: ['', [Validators.minLength(10)]],
    ingredientsAr: ['', [Validators.minLength(10)]],
    ingredientsEn: ['', [Validators.minLength(10)]],
    usageInstructionsAr: ['', [Validators.minLength(10)]],
    usageInstructionsEn: ['', [Validators.minLength(10)]],
    price: [null as number | null, [Validators.required, Validators.min(0)]]
  });

  ngOnInit(): void {
    // Load categories for the checkboxes
    this.categoriesService.loadAll().subscribe();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(id);
      this.loadProduct(id);
    }
  }

  private loadProduct(id: string): void {
    this.pageLoading.set(true);
    this.productsService.getById(id).subscribe({
      next: res => {
        this.pageLoading.set(false);
        if (res.success && res.data) {
          this.patchFormWithProduct(res.data);
        }
      },
      error: err => {
        this.pageLoading.set(false);
        if (err?.status === 401) {
          this.router.navigate(['/admin/login']);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: this.isAr() ? 'خطأ' : 'Error',
            detail: this.isAr() ? 'فشل تحميل المنتج' : 'Failed to load product',
            life: 5000
          });
        }
      }
    });
  }

  private patchFormWithProduct(product: AdminProduct): void {
    this.currentProduct.set(product);

    this.textForm.patchValue({
      nameAr: product.nameAr,
      nameEn: product.nameEn,
      descriptionAr: product.descriptionAr ?? '',
      descriptionEn: product.descriptionEn ?? '',
      ingredientsAr: product.ingredientsAr ?? '',
      ingredientsEn: product.ingredientsEn ?? '',
      usageInstructionsAr: product.usageInstructionsAr ?? '',
      usageInstructionsEn: product.usageInstructionsEn ?? '',
      price: product.price
    });

    this.selectedCategoryIds.set(new Set(product.categories.map(c => c.id)));
    this.coverPreviewUrl.set(product.coverImageUrl);
  }

  // ── Category helpers ───────────────────────────────────────────────────────

  isCategorySelected(id: string): boolean {
    return this.selectedCategoryIds().has(id);
  }

  toggleCategory(id: string): void {
    this.selectedCategoryIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // ── Form field validation helper ───────────────────────────────────────────

  isInvalid(field: string, form: typeof this.textForm): boolean {
    const ctrl: AbstractControl | null = form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  // ── Cover image selection ──────────────────────────────────────────────────

  onCoverSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedCoverFile.set(file);
    this.coverFileName.set(file.name);
    this.coverMissing.set(false);

    // Generate preview URL
    if (this.coverPreviewUrl() && isPlatformBrowser(this.platformId)) {
      // Revoke previous object URL to avoid memory leaks
    }
    if (isPlatformBrowser(this.platformId)) {
      this.coverPreviewUrl.set(URL.createObjectURL(file));
    }

    // Reset the input so the same file can be chosen again
    input.value = '';
  }

  // ── Submit: text form ──────────────────────────────────────────────────────

  submitTextForm(): void {
    if (this.textForm.invalid) {
      this.textForm.markAllAsTouched();
      this.messageService.add({
        severity: 'error',
        summary: this.isAr() ? 'خطأ' : 'Error',
        detail: this.isAr() ? 'يرجى إكمال الحقول المطلوبة' : 'Please fill all required fields',
        life: 4000
      });
      return;
    }

    const raw = this.textForm.getRawValue();

    if (this.isEditMode()) {
      // Update text/categories via JSON PATCH
      const payload: UpdateProductTextPayload = {
        nameAr: raw.nameAr!,
        nameEn: raw.nameEn!,
        descriptionAr: raw.descriptionAr || undefined,
        descriptionEn: raw.descriptionEn || undefined,
        ingredientsAr: raw.ingredientsAr || undefined,
        ingredientsEn: raw.ingredientsEn || undefined,
        usageInstructionsAr: raw.usageInstructionsAr || undefined,
        usageInstructionsEn: raw.usageInstructionsEn || undefined,
        price: raw.price!,
        categoryIds: [...this.selectedCategoryIds()]
      };

      this.textSaving.set(true);
      this.textServerError.set(null);
      this.productsService.updateText(this.productId()!, payload).subscribe({
        next: res => {
          this.textSaving.set(false);
          if (res.success && res.data) {
            this.currentProduct.set(res.data);
          }
          this.messageService.add({
            severity: 'success',
            summary: this.isAr() ? 'تم الحفظ' : 'Saved',
            detail: this.isAr() ? 'تم تحديث المنتج بنجاح' : 'Product updated successfully',
            life: 3000
          });
        },
        error: err => {
          this.textSaving.set(false);
          if (err?.status === 401) {
            this.router.navigate(['/admin/login']);
            return;
          }
          this.textServerError.set(
            err?.error?.message ?? (this.isAr() ? 'حدث خطأ ما' : 'Something went wrong')
          );
        }
      });
    } else {
      // Create: multipart/form-data
      if (!this.selectedCoverFile()) {
        this.coverMissing.set(true);
        this.messageService.add({
          severity: 'warn',
          summary: this.isAr() ? 'تنبيه' : 'Warning',
          detail: this.isAr() ? 'يرجى اختيار صورة الغلاف' : 'Please select a cover image',
          life: 4000
        });
        return;
      }

      const formData = new FormData();
      formData.append('nameAr', raw.nameAr!);
      formData.append('nameEn', raw.nameEn!);
      if (raw.descriptionAr) formData.append('descriptionAr', raw.descriptionAr);
      if (raw.descriptionEn) formData.append('descriptionEn', raw.descriptionEn);
      if (raw.ingredientsAr) formData.append('ingredientsAr', raw.ingredientsAr);
      if (raw.ingredientsEn) formData.append('ingredientsEn', raw.ingredientsEn);
      if (raw.usageInstructionsAr) formData.append('usageInstructionsAr', raw.usageInstructionsAr);
      if (raw.usageInstructionsEn) formData.append('usageInstructionsEn', raw.usageInstructionsEn);
      formData.append('price', String(raw.price));
      formData.append('coverImage', this.selectedCoverFile()!);
      [...this.selectedCategoryIds()].forEach(id => formData.append('categoryIds', id));

      this.textSaving.set(true);
      this.textServerError.set(null);
      this.productsService.create(formData).subscribe({
        next: res => {
          this.textSaving.set(false);
          this.messageService.add({
            severity: 'success',
            summary: this.isAr() ? 'تم الإنشاء' : 'Created',
            detail: this.isAr() ? 'تم إنشاء المنتج بنجاح' : 'Product created successfully',
            life: 3000
          });
          // Navigate to edit page so the admin can add gallery images
          if (res.success && res.data?.id) {
            this.router.navigate(['/admin/products', res.data.id, 'edit']);
          } else {
            this.router.navigate(['/admin/products']);
          }
        },
        error: err => {
          this.textSaving.set(false);
          if (err?.status === 401) {
            this.router.navigate(['/admin/login']);
            return;
          }
          this.textServerError.set(
            err?.error?.message ?? (this.isAr() ? 'حدث خطأ ما' : 'Something went wrong')
          );
        }
      });
    }
  }

  // ── Submit: cover image replace ────────────────────────────────────────────

  submitCoverReplace(): void {
    const file = this.selectedCoverFile();
    if (!file) return;

    const formData = new FormData();
    formData.append('coverImage', file);

    this.coverSaving.set(true);
    this.coverServerError.set(null);
    this.productsService.replaceCover(this.productId()!, formData).subscribe({
      next: res => {
        this.coverSaving.set(false);
        this.selectedCoverFile.set(null);
        this.coverFileName.set(null);
        if (res.success && res.data) {
          this.coverPreviewUrl.set(res.data.coverImageUrl);
          this.currentProduct.update(p =>
            p ? { ...p, coverImageUrl: res.data.coverImageUrl, coverImagePublicId: res.data.coverImagePublicId } : p
          );
        }
        this.messageService.add({
          severity: 'success',
          summary: this.isAr() ? 'تم الرفع' : 'Uploaded',
          detail: this.isAr() ? 'تم تحديث صورة الغلاف' : 'Cover image updated',
          life: 3000
        });
      },
      error: err => {
        this.coverSaving.set(false);
        if (err?.status === 401) {
          this.router.navigate(['/admin/login']);
          return;
        }
        this.coverServerError.set(
          err?.error?.message ?? (this.isAr() ? 'فشل رفع الصورة' : 'Failed to upload cover image')
        );
      }
    });
  }

  // ── Refresh product (after gallery changes) ────────────────────────────────

  refreshProduct(): void {
    const id = this.productId();
    if (!id) return;
    this.productsService.getById(id).subscribe({
      next: res => {
        if (res.success && res.data) {
          this.currentProduct.set(res.data);
        }
      }
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/admin/products']);
  }
}
