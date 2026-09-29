import {
  Component, inject, signal, computed, OnInit, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ReactiveFormsModule, FormBuilder, Validators, AbstractControl,
  ValidatorFn, ValidationErrors
} from '@angular/forms';

// PrimeNG
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { DatePicker } from 'primeng/datepicker';
import { Checkbox } from 'primeng/checkbox';
import { Toast } from 'primeng/toast';
import { Skeleton } from 'primeng/skeleton';
import { Message } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { OffersService, Offer } from '../../../../offers/offers.service';
import { LanguageService } from '../../../../../core/services/language.service';

// ── Custom cross-field validator ──────────────────────────────────────────────

/**
 * Group-level validator: ensures endDate is strictly after startDate.
 * Applied to the FormGroup so both controls are accessible.
 */
function endDateAfterStartDate(): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const start: Date | null = group.get('startDate')?.value ?? null;
    const end: Date | null = group.get('endDate')?.value ?? null;

    if (!start || !end) return null;
    return end.getTime() > start.getTime() ? null : { endBeforeStart: true };
  };
}

@Component({
  selector: 'app-admin-offer-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Button,
    InputText,
    Textarea,
    DatePicker,
    Checkbox,
    Toast,
    Skeleton,
    Message,
    Tooltip,
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

    small.p-error {
      font-size: 0.8rem;
      color: #f87171;
      margin-top: 0.125rem;
      display: block;
    }

    /* Image upload */
    .image-preview-wrap {
      position: relative;
      display: inline-block;
    }

    .image-preview {
      width: 200px;
      height: 130px;
      object-fit: cover;
      border-radius: 0.5rem;
      border: 1px solid #334155;
      display: block;
    }

    .image-placeholder {
      width: 200px;
      height: 130px;
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

    .image-placeholder i { font-size: 2rem; }
    .image-placeholder span { font-size: 0.8125rem; }

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

    .section-divider {
      border: none;
      border-top: 1px solid #334155;
      margin: 1.5rem 0;
      grid-column: 1 / -1;
    }

    .form-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 1.5rem;
    }

    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 0;
    }

    .checkbox-label {
      font-size: 0.9375rem;
      color: #cbd5e1;
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
            ? (isAr() ? 'تعديل العرض' : 'Edit Offer')
            : (isAr() ? 'إضافة عرض جديد' : 'New Offer')
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

    <!-- Form card -->
    <div class="form-card">
      <h2 class="card-title">
        <i class="pi pi-file-edit"></i>
        {{ isAr() ? 'بيانات العرض' : 'Offer Details' }}
      </h2>

      @if (serverError()) {
        <p-message severity="error" style="margin-bottom:1rem;display:block">
          {{ serverError() }}
        </p-message>
      }

      <!-- Cross-field date error -->
      @if (form.errors?.['endBeforeStart'] && (form.get('endDate')?.touched || form.get('startDate')?.touched)) {
        <p-message severity="error" style="margin-bottom:1rem;display:block">
          {{ isAr() ? 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية' : 'End date must be strictly after start date' }}
        </p-message>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid">

        <!-- Arabic Title -->
        <div class="field">
          <label for="titleAr">
            {{ isAr() ? 'العنوان بالعربية' : 'Arabic Title' }}
            <span class="required">*</span>
          </label>
          <input
            id="titleAr"
            pInputText
            formControlName="titleAr"
            dir="rtl"
            [placeholder]="isAr() ? 'عنوان العرض بالعربية' : 'Offer title in Arabic'"
            [class.ng-invalid]="isInvalid('titleAr')"
            [class.ng-dirty]="isInvalid('titleAr')"
          />
          @if (isInvalid('titleAr')) {
            <small class="p-error">{{ isAr() ? 'العنوان بالعربية مطلوب' : 'Arabic title is required' }}</small>
          }
        </div>

        <!-- English Title -->
        <div class="field">
          <label for="titleEn">
            {{ isAr() ? 'العنوان بالإنجليزية' : 'English Title' }}
            <span class="required">*</span>
          </label>
          <input
            id="titleEn"
            pInputText
            formControlName="titleEn"
            dir="ltr"
            [placeholder]="isAr() ? 'عنوان العرض بالإنجليزية' : 'Offer title in English'"
            [class.ng-invalid]="isInvalid('titleEn')"
            [class.ng-dirty]="isInvalid('titleEn')"
          />
          @if (isInvalid('titleEn')) {
            <small class="p-error">{{ isAr() ? 'العنوان بالإنجليزية مطلوب' : 'English title is required' }}</small>
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
            [placeholder]="isAr() ? 'وصف العرض بالعربية (اختياري)' : 'Offer description in Arabic (optional)'"
            style="width:100%;resize:vertical"
          ></textarea>
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
            [placeholder]="isAr() ? 'وصف العرض بالإنجليزية (اختياري)' : 'Offer description in English (optional)'"
            style="width:100%;resize:vertical"
          ></textarea>
        </div>

        <hr class="section-divider" />

        <!-- Start Date -->
        <div class="field">
          <label for="startDate">
            {{ isAr() ? 'تاريخ البداية' : 'Start Date' }}
            <span class="required">*</span>
          </label>
          <p-date-picker
            inputId="startDate"
            formControlName="startDate"
            [showTime]="false"
            dateFormat="dd/mm/yy"
            [placeholder]="isAr() ? 'اختر تاريخ البداية' : 'Choose start date'"
            style="width:100%"
            [class.ng-invalid]="isInvalid('startDate')"
            [class.ng-dirty]="isInvalid('startDate')"
          />
          @if (isInvalid('startDate')) {
            <small class="p-error">{{ isAr() ? 'تاريخ البداية مطلوب' : 'Start date is required' }}</small>
          }
        </div>

        <!-- End Date -->
        <div class="field">
          <label for="endDate">
            {{ isAr() ? 'تاريخ الانتهاء' : 'End Date' }}
            <span class="required">*</span>
          </label>
          <p-date-picker
            inputId="endDate"
            formControlName="endDate"
            [showTime]="false"
            dateFormat="dd/mm/yy"
            [placeholder]="isAr() ? 'اختر تاريخ الانتهاء' : 'Choose end date'"
            style="width:100%"
            [class.ng-invalid]="isInvalid('endDate') || (form.errors?.['endBeforeStart'] && form.get('endDate')?.touched)"
            [class.ng-dirty]="isInvalid('endDate') || (form.errors?.['endBeforeStart'] && form.get('endDate')?.touched)"
          />
          @if (isInvalid('endDate')) {
            <small class="p-error">{{ isAr() ? 'تاريخ الانتهاء مطلوب' : 'End date is required' }}</small>
          }
        </div>

        <!-- Show in Top Banner checkbox -->
        <div class="field-full">
          <div class="checkbox-row">
            <p-checkbox
              formControlName="showInTopBanner"
              [binary]="true"
              inputId="showInTopBanner"
            />
            <label for="showInTopBanner" class="checkbox-label" style="cursor:pointer">
              {{ isAr() ? 'عرضه في الشريط العلوي' : 'Show in top banner' }}
            </label>
          </div>
        </div>

        <hr class="section-divider" />

        <!-- Image upload section -->
        <div class="field-full">
          <label>{{ isAr() ? 'صورة العرض' : 'Offer Image' }} ({{ isAr() ? 'اختياري' : 'optional' }})</label>

          <div style="display:flex;flex-direction:column;align-items:flex-start;gap:0.75rem;margin-top:0.5rem">

            <!-- Preview or placeholder -->
            @if (imagePreviewUrl()) {
              <div class="image-preview-wrap">
                <img class="image-preview" [src]="imagePreviewUrl()" alt="offer image preview" />
              </div>
            } @else {
              <div class="image-placeholder">
                <i class="pi pi-image"></i>
                <span>{{ isAr() ? 'لا توجد صورة' : 'No image selected' }}</span>
              </div>
            }

            <!-- File input trigger -->
            <label class="upload-label">
              <i class="pi pi-upload"></i>
              {{ isEditMode()
                  ? (isAr() ? 'استبدال الصورة' : 'Replace Image')
                  : (isAr() ? 'اختر صورة' : 'Choose Image')
              }}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                (change)="onImageSelected($event)"
              />
            </label>

            @if (imageFileName()) {
              <span class="file-name">{{ imageFileName() }}</span>
            }
          </div>
        </div>

      </form>

      <!-- Actions -->
      <div class="form-actions">
        <p-button
          [label]="isAr() ? 'إلغاء' : 'Cancel'"
          severity="secondary"
          [text]="true"
          (click)="goBack()"
        />
        <p-button
          [label]="offersService.saving()
            ? (isAr() ? 'جارٍ الحفظ...' : 'Saving...')
            : (isEditMode() ? (isAr() ? 'حفظ التغييرات' : 'Save Changes') : (isAr() ? 'إضافة العرض' : 'Create Offer'))"
          [icon]="offersService.saving() ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
          [loading]="offersService.saving()"
          [disabled]="offersService.saving()"
          (click)="onSubmit()"
        />
      </div>
    </div>

    } <!-- end @if (!pageLoading()) -->
  `
})
export class AdminOfferFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly offersService = inject(OffersService);
  private messageService = inject(MessageService);
  private langService = inject(LanguageService);
  private platformId = inject(PLATFORM_ID);

  readonly isAr = computed(() => this.langService.currentLang() === 'ar');

  // Route state
  readonly offerId = signal<string | null>(null);
  readonly isEditMode = computed(() => !!this.offerId());

  // Page state
  readonly pageLoading = signal(false);
  readonly serverError = signal<string | null>(null);

  // Image state
  readonly selectedImageFile = signal<File | null>(null);
  readonly imagePreviewUrl = signal<string | null>(null);
  readonly imageFileName = signal<string | null>(null);

  // Reactive form with the cross-field validator on the group
  readonly form = this.fb.group(
    {
      titleAr:        ['', [Validators.required, Validators.minLength(2)]],
      titleEn:        ['', [Validators.required, Validators.minLength(2)]],
      descriptionAr:  [''],
      descriptionEn:  [''],
      startDate:      [null as Date | null, Validators.required],
      endDate:        [null as Date | null, Validators.required],
      showInTopBanner: [false],
    },
    { validators: endDateAfterStartDate() }
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.offerId.set(id);
      this.loadOffer(id);
    }
  }

  // ── Load offer for edit ────────────────────────────────────────────────────

  private loadOffer(id: string): void {
    this.pageLoading.set(true);
    this.offersService.adminGetById(id).subscribe({
      next: res => {
        this.pageLoading.set(false);
        if (res.success && res.data) {
          this.patchForm(res.data);
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
            detail: this.isAr() ? 'فشل تحميل العرض' : 'Failed to load offer',
            life: 5000
          });
        }
      }
    });
  }

  private patchForm(offer: Offer): void {
    this.form.patchValue({
      titleAr:         offer.titleAr,
      titleEn:         offer.titleEn,
      descriptionAr:   offer.descriptionAr ?? '',
      descriptionEn:   offer.descriptionEn ?? '',
      startDate:       new Date(offer.startDate),
      endDate:         new Date(offer.endDate),
      showInTopBanner: offer.showInTopBanner,
    });

    if (offer.imageUrl) {
      this.imagePreviewUrl.set(offer.imageUrl);
    }
  }

  // ── Image selection ────────────────────────────────────────────────────────

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.selectedImageFile.set(file);
    this.imageFileName.set(file.name);

    if (isPlatformBrowser(this.platformId)) {
      this.imagePreviewUrl.set(URL.createObjectURL(file));
    }

    // Reset input so the same file can be re-selected
    input.value = '';
  }

  // ── Form validation helper ─────────────────────────────────────────────────

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  onSubmit(): void {
    // Mark all fields as touched to trigger validation messages
    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    this.serverError.set(null);

    const v = this.form.value;
    const fd = new FormData();

    fd.append('titleAr',         v.titleAr ?? '');
    fd.append('titleEn',         v.titleEn ?? '');
    fd.append('descriptionAr',   v.descriptionAr ?? '');
    fd.append('descriptionEn',   v.descriptionEn ?? '');
    fd.append('startDate',       (v.startDate as Date).toISOString());
    fd.append('endDate',         (v.endDate as Date).toISOString());
    fd.append('showInTopBanner', String(v.showInTopBanner ?? false));

    if (this.selectedImageFile()) {
      fd.append('image', this.selectedImageFile()!);
    }

    const request$ = this.isEditMode()
      ? this.offersService.adminUpdate(this.offerId()!, fd)
      : this.offersService.adminCreate(fd);

    request$.subscribe({
      next: res => {
        this.messageService.add({
          severity: 'success',
          summary: this.isAr() ? 'تم الحفظ' : 'Saved',
          detail: this.isAr()
            ? (this.isEditMode() ? 'تم تحديث العرض بنجاح' : 'تم إضافة العرض بنجاح')
            : (this.isEditMode() ? 'Offer updated successfully' : 'Offer created successfully'),
          life: 3000
        });

        // Brief delay so the user sees the toast before navigating
        setTimeout(() => this.router.navigate(['/admin/offers']), 1200);
      },
      error: err => {
        const detail = err?.error?.message ?? (this.isAr() ? 'حدث خطأ أثناء الحفظ' : 'An error occurred while saving');
        this.serverError.set(Array.isArray(detail) ? detail.join(', ') : detail);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/offers']);
  }
}
