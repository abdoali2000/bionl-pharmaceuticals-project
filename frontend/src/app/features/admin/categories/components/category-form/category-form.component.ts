import {
  Component, inject, input, output, signal, computed, OnChanges, SimpleChanges, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, Validators, AbstractControl
} from '@angular/forms';

// PrimeNG
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';

import { CategoriesService, Category } from '../../categories.service';

/** Utility: mirror backend SlugService logic for client-side preview */
function toSlugPreview(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

@Component({
  selector: 'app-category-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    Dialog,
    InputText,
    Button,
    Message,
  ],
  styles: [`
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      padding: 0.25rem 0;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--p-text-color, #e2e8f0);
    }
    label .required {
      color: #f87171;
      margin-inline-start: 0.2rem;
    }
    input.p-inputtext { width: 100%; }
    .field-error {
      font-size: 0.8rem;
      color: #f87171;
    }
    .slug-preview {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(99,102,241,0.08);
      border: 1px dashed rgba(99,102,241,0.4);
      border-radius: 0.5rem;
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
    }
    .slug-label { color: #94a3b8; font-weight: 500; flex-shrink: 0; }
    .slug-value { color: #a5b4fc; font-family: monospace; word-break: break-all; }
    .slug-readonly {
      background: rgba(100,116,139,0.12);
      border: 1px solid rgba(100,116,139,0.3);
      border-radius: 0.5rem;
      padding: 0.625rem 0.875rem;
      font-size: 0.875rem;
      color: #94a3b8;
      font-family: monospace;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .slug-note { font-size: 0.75rem; color: #64748b; }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding-top: 0.5rem;
      border-top: 1px solid rgba(100,116,139,0.2);
    }
  `],
  template: `
    <p-dialog
      [visible]="dialogVisible()"
      (visibleChange)="onVisibleChange($event)"
      [header]="isEditMode() ? (isAr() ? 'تعديل التصنيف' : 'Edit Category') : (isAr() ? 'إضافة تصنيف' : 'New Category')"
      [modal]="true"
      [closable]="true"
      [style]="{ width: '480px', maxWidth: '95vw' }"
    >
      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid">

        @if (serverError()) {
          <p-message severity="error">{{ serverError() }}</p-message>
        }

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
            [placeholder]="isAr() ? 'مثال: مستحضرات تجميل' : 'e.g. مستحضرات تجميل'"
            [class.ng-invalid]="isInvalid('nameAr')"
            [class.ng-dirty]="isInvalid('nameAr')"
          />
          @if (isInvalid('nameAr')) {
            <span class="field-error">{{ isAr() ? 'الحد الأدنى حرفان' : 'Minimum 2 characters' }}</span>
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
            [placeholder]="isAr() ? 'مثال: Cosmetics' : 'e.g. Cosmetics'"
            [class.ng-invalid]="isInvalid('nameEn')"
            [class.ng-dirty]="isInvalid('nameEn')"
          />
          @if (isInvalid('nameEn')) {
            <span class="field-error">{{ isAr() ? 'الحد الأدنى حرفان' : 'Minimum 2 characters' }}</span>
          }
        </div>

        <!-- Slug section -->
        @if (!isEditMode()) {
          <div class="field">
            <label>{{ isAr() ? 'معاينة الرابط' : 'Slug Preview' }}</label>
            <div class="slug-preview">
              <span class="slug-label">slug:</span>
              <span class="slug-value">{{ slugPreview() || '—' }}</span>
            </div>
            <span class="slug-note">
              {{ isAr() ? 'يُنشأ تلقائيًا ولا يمكن تغييره لاحقًا' : 'Auto-generated, cannot be changed later' }}
            </span>
          </div>
        } @else {
          <div class="field">
            <label>{{ isAr() ? 'الرابط الحالي' : 'Current Slug' }}</label>
            <div class="slug-readonly">
              <i class="pi pi-lock" style="color:#64748b"></i>
              {{ editCategory()?.slug }}
            </div>
            <span class="slug-note">
              {{ isAr() ? 'الرابط لن يتغيّر عند التعديل (لحماية SEO)' : 'Slug will not change on edit (SEO protection)' }}
            </span>
          </div>
        }
      </form>

      <ng-template #footer>
        <div class="dialog-footer">
          <p-button
            [label]="isAr() ? 'إلغاء' : 'Cancel'"
            severity="secondary"
            [text]="true"
            (click)="onCancel()"
          />
          <p-button
            [label]="saving() ? (isAr() ? 'جارٍ الحفظ...' : 'Saving...') : (isAr() ? 'حفظ' : 'Save')"
            [icon]="saving() ? 'pi pi-spin pi-spinner' : 'pi pi-check'"
            [loading]="saving()"
            [disabled]="form.invalid || saving()"
            (click)="onSubmit()"
          />
        </div>
      </ng-template>
    </p-dialog>
  `
})
export class CategoryFormComponent implements OnChanges {
  private fb = inject(FormBuilder);
  private categoriesService = inject(CategoriesService);

  // ── Inputs / outputs ──────────────────────────────────────────────────────
  visible = input.required<boolean>();
  editCategory = input<Category | null>(null);
  isAr = input<boolean>(true);

  saved = output<void>();
  cancelled = output<void>();

  // ── State ─────────────────────────────────────────────────────────────────
  /** Local writable signal synced from the `visible` input */
  dialogVisible = signal(false);

  saving = signal(false);
  serverError = signal<string | null>(null);

  isEditMode = computed(() => !!this.editCategory());

  form = this.fb.group({
    nameAr: ['', [Validators.required, Validators.minLength(2)]],
    nameEn: ['', [Validators.required, Validators.minLength(2)]]
  });

  /** Tracks nameEn value for slug preview — recalculated on every keystroke */
  slugPreview = signal('');

  constructor() {
    // Sync visible input → local signal
    effect(() => { this.dialogVisible.set(this.visible()); });
    // Sync nameEn → slugPreview
    this.form.get('nameEn')!.valueChanges.subscribe(v => {
      this.slugPreview.set(toSlugPreview(v ?? ''));
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editCategory']) {
      this.form.reset();
      this.serverError.set(null);
      this.slugPreview.set('');
      const cat = this.editCategory();
      if (cat) {
        this.form.patchValue({ nameAr: cat.nameAr, nameEn: cat.nameEn });
      }
    }
  }

  onVisibleChange(val: boolean): void {
    if (!val) { this.onCancel(); }
  }

  isInvalid(field: string): boolean {
    const ctrl: AbstractControl | null = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.saving.set(true);
    this.serverError.set(null);
    const { nameAr, nameEn } = this.form.getRawValue();
    const cat = this.editCategory();

    const obs = cat
      ? this.categoriesService.update(cat.id, { nameAr: nameAr!, nameEn: nameEn! })
      : this.categoriesService.create({ nameAr: nameAr!, nameEn: nameEn! });

    obs.subscribe({
      next: () => { this.saving.set(false); this.saved.emit(); },
      error: err => {
        this.saving.set(false);
        this.serverError.set(err?.error?.message ?? (this.isAr() ? 'حدث خطأ ما' : 'Something went wrong'));
      }
    });
  }

  onCancel(): void {
    this.form.reset();
    this.serverError.set(null);
    this.cancelled.emit();
  }
}
