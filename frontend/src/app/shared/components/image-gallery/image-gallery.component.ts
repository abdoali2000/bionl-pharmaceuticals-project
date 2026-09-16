import { Component, Input, OnChanges, SimpleChanges, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PublicProductImage } from '../../../features/products/products.service';

export interface GalleryImage {
  url: string;
  alt: string;
}

@Component({
  selector: 'app-image-gallery',
  standalone: true,
  imports: [CommonModule],
  styles: [`
    :host { display: block; }

    /* ── Main image ──────────────────────────────────────────────────────────── */
    .main-image-wrap {
      position: relative;
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 0.875rem;
      overflow: hidden;
      background: #f1f5f9;
    }

    .main-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: opacity 0.2s ease;
    }

    .main-image.fade {
      opacity: 0;
    }

    /* ── Thumbnail row ───────────────────────────────────────────────────────── */
    .thumbnail-row {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.75rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
      scrollbar-width: none;
    }

    .thumbnail-row::-webkit-scrollbar { display: none; }

    .thumb-btn {
      flex-shrink: 0;
      width: 64px;
      height: 64px;
      border-radius: 0.5rem;
      overflow: hidden;
      padding: 0;
      border: 2px solid transparent;
      background: #f1f5f9;
      cursor: pointer;
      transition: border-color 0.15s;
    }

    .thumb-btn:hover {
      border-color: #94a3b8;
    }

    .thumb-btn.active {
      border-color: #6366f1;
    }

    .thumb-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  `],
  template: `
    <!-- Main display image -->
    <div class="main-image-wrap">
      <img
        class="main-image"
        [class.fade]="fading()"
        [src]="activeImage().url"
        [alt]="activeImage().alt"
      />
    </div>

    <!-- Thumbnails — only shown when there is more than one image -->
    @if (allImages().length > 1) {
      <div class="thumbnail-row" role="list" aria-label="Product images">
        @for (img of allImages(); track img.url; let i = $index) {
          <button
            class="thumb-btn"
            [class.active]="activeIndex() === i"
            (click)="selectImage(i)"
            type="button"
            role="listitem"
            [attr.aria-label]="'Image ' + (i + 1)"
            [attr.aria-pressed]="activeIndex() === i"
          >
            <img class="thumb-img" [src]="img.url" [alt]="img.alt" loading="lazy" />
          </button>
        }
      </div>
    }
  `
})
export class ImageGalleryComponent implements OnChanges {
  /** The product cover image URL (always shown first). */
  @Input({ required: true }) coverImageUrl!: string;

  /** Localized product name — used as the alt text for the cover image. */
  @Input() altText = '';

  /** Sorted gallery images from the API (by displayOrder). */
  @Input() galleryImages: PublicProductImage[] = [];

  // Internal signals
  readonly activeIndex = signal(0);
  readonly fading = signal(false);

  /** Merge cover + gallery images into one ordered array. */
  readonly allImages = computed<GalleryImage[]>(() => {
    const cover: GalleryImage = { url: this.coverImageUrl, alt: this.altText || 'Product image' };
    const gallery: GalleryImage[] = [...this.galleryImages]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((img, i) => ({ url: img.imageUrl, alt: `${this.altText} — image ${i + 2}` }));
    return [cover, ...gallery];
  });

  readonly activeImage = computed(() => this.allImages()[this.activeIndex()] ?? this.allImages()[0]);

  ngOnChanges(changes: SimpleChanges): void {
    // Reset to first image when the product changes (e.g., navigating between detail pages)
    if (changes['coverImageUrl']) {
      this.activeIndex.set(0);
    }
  }

  selectImage(index: number): void {
    if (index === this.activeIndex()) return;

    // Brief fade transition before swapping image
    this.fading.set(true);
    setTimeout(() => {
      this.activeIndex.set(index);
      this.fading.set(false);
    }, 150);
  }
}
