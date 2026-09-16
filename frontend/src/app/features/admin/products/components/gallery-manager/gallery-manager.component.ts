import {
  Component, inject, input, output, signal, computed, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';

// PrimeNG
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { ProgressSpinner } from 'primeng/progressspinner';
import { Tooltip } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';

import { AdminProductsService, ProductImage, ReorderImageItem } from '../../admin-products.service';
import { LanguageService } from '../../../../../core/services/language.service';

@Component({
  selector: 'app-gallery-manager',
  standalone: true,
  imports: [
    CommonModule,
    Button,
    Toast,
    ProgressSpinner,
    Tooltip,
  ],
  providers: [MessageService],
  styles: [`
    :host { display: block; }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #e2e8f0;
      margin: 0 0 1rem;
    }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 0.75rem;
      margin-bottom: 1.25rem;
    }

    .gallery-item {
      position: relative;
      border: 1px solid #334155;
      border-radius: 0.5rem;
      overflow: hidden;
      background: #0f172a;
    }

    .gallery-img {
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
      display: block;
    }

    .gallery-order-badge {
      position: absolute;
      top: 0.25rem;
      left: 0.25rem;
      background: rgba(15,23,42,0.75);
      color: #94a3b8;
      font-size: 0.6875rem;
      padding: 0.125rem 0.375rem;
      border-radius: 0.25rem;
      font-family: monospace;
    }

    .gallery-item-actions {
      position: absolute;
      inset: 0;
      background: rgba(15,23,42,0.6);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .gallery-item:hover .gallery-item-actions {
      opacity: 1;
    }

    .gallery-actions-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

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
    }

    .upload-label:hover { background: #4f46e5; }

    .upload-label input { display: none; }

    .empty-gallery {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 2rem;
      border: 2px dashed #334155;
      border-radius: 0.75rem;
      color: #64748b;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .empty-gallery i { font-size: 1.75rem; }

    .empty-gallery p { margin: 0; font-size: 0.875rem; }

    .spinner-wrap {
      display: flex;
      justify-content: center;
      padding: 1rem;
    }

    .reorder-note {
      font-size: 0.8125rem;
      color: #64748b;
    }
  `],
  template: `
    <p-toast />

    <h3 class="section-title">
      {{ isAr() ? 'معرض الصور' : 'Image Gallery' }}
    </h3>

    <!-- Upload + Reorder controls -->
    <div class="gallery-actions-row">
      <!-- File upload trigger -->
      <label class="upload-label">
        <i class="pi pi-upload"></i>
        {{ isAr() ? 'رفع صور' : 'Upload Images' }}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          (change)="onFilesSelected($event)"
        />
      </label>

      <!-- Save reorder button — only visible when order changed -->
      @if (orderChanged()) {
        <p-button
          [label]="isAr() ? 'حفظ الترتيب' : 'Save Order'"
          icon="pi pi-check"
          severity="success"
          [loading]="reordering()"
          (click)="saveReorder()"
        />
      }

      <span class="reorder-note">
        {{ isAr()
            ? 'استخدم السهمين لإعادة ترتيب الصور'
            : 'Use arrows to reorder images'
        }}
      </span>
    </div>

    <!-- Gallery grid -->
    @if (uploading()) {
      <div class="spinner-wrap">
        <p-progress-spinner strokeWidth="4" style="width:48px;height:48px" />
      </div>
    } @else if (localImages().length === 0) {
      <div class="empty-gallery">
        <i class="pi pi-images"></i>
        <p>{{ isAr() ? 'لا توجد صور في المعرض' : 'No gallery images yet' }}</p>
      </div>
    } @else {
      <div class="gallery-grid">
        @for (img of localImages(); track img.id; let i = $index) {
          <div class="gallery-item">
            <img class="gallery-img" [src]="img.imageUrl" alt="gallery image" />
            <span class="gallery-order-badge">#{{ i + 1 }}</span>
            <div class="gallery-item-actions">
              <!-- Move up -->
              <p-button
                icon="pi pi-arrow-up"
                [rounded]="true"
                severity="secondary"
                size="small"
                [disabled]="i === 0"
                (click)="moveUp(i)"
                [pTooltip]="isAr() ? 'تحريك للأعلى' : 'Move up'"
              />
              <!-- Delete -->
              <p-button
                icon="pi pi-trash"
                [rounded]="true"
                severity="danger"
                size="small"
                [loading]="deletingId() === img.id"
                (click)="deleteImage(img.id)"
                [pTooltip]="isAr() ? 'حذف' : 'Delete'"
              />
              <!-- Move down -->
              <p-button
                icon="pi pi-arrow-down"
                [rounded]="true"
                severity="secondary"
                size="small"
                [disabled]="i === localImages().length - 1"
                (click)="moveDown(i)"
                [pTooltip]="isAr() ? 'تحريك للأسفل' : 'Move down'"
              />
            </div>
          </div>
        }
      </div>
    }
  `
})
export class GalleryManagerComponent implements OnChanges {
  private productsService = inject(AdminProductsService);
  private messageService = inject(MessageService);
  private langService = inject(LanguageService);

  // Inputs
  productId = input.required<string>();
  images = input<ProductImage[]>([]);

  // Output when gallery has been mutated (parent should refresh product)
  galleryChanged = output<void>();

  isAr = computed(() => this.langService.currentLang() === 'ar');

  /** Local mutable copy of the images list for optimistic reordering. */
  localImages = signal<ProductImage[]>([]);

  /** Tracks whether the local order differs from the original. */
  orderChanged = signal(false);

  uploading = signal(false);
  reordering = signal(false);
  deletingId = signal<string | null>(null);

  /** Snapshot of IDs in their original order from the server. */
  private originalOrder: string[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images']) {
      const imgs = [...(this.images() ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);
      this.localImages.set(imgs);
      this.originalOrder = imgs.map(i => i.id);
      this.orderChanged.set(false);
    }
  }

  // ── Reorder ──────────────────────────────────────────────────────────────

  moveUp(index: number): void {
    if (index === 0) return;
    const list = [...this.localImages()];
    [list[index - 1], list[index]] = [list[index], list[index - 1]];
    this.localImages.set(list);
    this.checkOrderChanged();
  }

  moveDown(index: number): void {
    const list = this.localImages();
    if (index === list.length - 1) return;
    const arr = [...list];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    this.localImages.set(arr);
    this.checkOrderChanged();
  }

  private checkOrderChanged(): void {
    const current = this.localImages().map(i => i.id);
    this.orderChanged.set(
      current.length !== this.originalOrder.length ||
      current.some((id, idx) => id !== this.originalOrder[idx])
    );
  }

  saveReorder(): void {
    if (!this.orderChanged()) return;

    const items: ReorderImageItem[] = this.localImages().map((img, idx) => ({
      id: img.id,
      displayOrder: idx + 1
    }));

    this.reordering.set(true);
    this.productsService.reorderImages(this.productId(), items).subscribe({
      next: () => {
        this.reordering.set(false);
        this.originalOrder = this.localImages().map(i => i.id);
        this.orderChanged.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.isAr() ? 'تم الحفظ' : 'Saved',
          detail: this.isAr() ? 'تم حفظ ترتيب الصور' : 'Image order saved',
          life: 3000
        });
        this.galleryChanged.emit();
      },
      error: err => {
        this.reordering.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.isAr() ? 'خطأ' : 'Error',
          detail: err?.error?.message ?? (this.isAr() ? 'فشل حفظ الترتيب' : 'Failed to save order'),
          life: 5000
        });
      }
    });
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  deleteImage(imageId: string): void {
    this.deletingId.set(imageId);
    this.productsService.deleteImage(this.productId(), imageId).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.localImages.update(list => list.filter(i => i.id !== imageId));
        this.originalOrder = this.localImages().map(i => i.id);
        this.orderChanged.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.isAr() ? 'تم الحذف' : 'Deleted',
          detail: this.isAr() ? 'تم حذف الصورة' : 'Image deleted',
          life: 3000
        });
        this.galleryChanged.emit();
      },
      error: err => {
        this.deletingId.set(null);
        this.messageService.add({
          severity: 'error',
          summary: this.isAr() ? 'خطأ' : 'Error',
          detail: err?.error?.message ?? (this.isAr() ? 'فشل حذف الصورة' : 'Failed to delete image'),
          life: 5000
        });
      }
    });
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }

    // Reset input so the same file can be selected again
    input.value = '';

    this.uploading.set(true);
    this.productsService.addImages(this.productId(), formData).subscribe({
      next: res => {
        this.uploading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: this.isAr() ? 'تم الرفع' : 'Uploaded',
          detail: this.isAr() ? 'تم رفع الصور بنجاح' : 'Images uploaded successfully',
          life: 3000
        });
        // Refresh gallery images from the returned product
        if (res.success && res.data?.images) {
          const imgs = [...res.data.images].sort((a, b) => a.displayOrder - b.displayOrder);
          this.localImages.set(imgs);
          this.originalOrder = imgs.map(i => i.id);
          this.orderChanged.set(false);
        }
        this.galleryChanged.emit();
      },
      error: err => {
        this.uploading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: this.isAr() ? 'خطأ' : 'Error',
          detail: err?.error?.message ?? (this.isAr() ? 'فشل رفع الصور' : 'Failed to upload images'),
          life: 5000
        });
      }
    });
  }
}
