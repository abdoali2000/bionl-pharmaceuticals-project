import { Injectable } from '@angular/core';

// Design preview only. Set false to use the real public API. Never seeds the database.
export const CATALOG_PREVIEW = true;
const names = [
  'Pure Balance',
  'Daily Essentials',
  'Derma Calm',
  'Bright C',
  'Gentle Care',
  'Vital Complex',
  'Hydra Plus',
];
const arabicNames = [
  'بيور بالانس',
  'ديلي إسنشالز',
  'ديرما كالم',
  'برايت سي',
  'جنتل كير',
  'فايتال كومبلكس',
  'هيدرا بلس',
];
export const previewProducts = names.map((name, i) => ({
  id: `demo-${i + 1}`,
  slug: name.toLowerCase().replaceAll(' ', '-'),
  nameEn: name,
  nameAr: arabicNames[i],
  descriptionAr:
    'عبوة تجريبية لمعاينة التصميم. اسم المنتج والسعر والصورة بيانات توضيحية، ولا تمثل منتجًا طبيًا معتمدًا أو توصية علاجية.',
  descriptionEn:
    'Sample packaging for the design preview. Name, price and imagery are illustrative, not a real medical product or treatment recommendation.',
  ingredientsAr: null,
  ingredientsEn: null,
  usageInstructionsAr: null,
  usageInstructionsEn: null,
  price: [240, 185, 320, 275, 160, 390, 210][i],
  coverImageUrl: `/brand/product-${i + 1}.svg`,
  categories: [],
  images: [],
}));
const offers = [
  {
    id: 'preview-offer-1',
    titleAr: 'اكتشف تشكيلتنا الجديدة',
    titleEn: 'Meet your new essentials',
    descriptionAr: 'سبعة تصاميم لمنتجات تجريبية، وهوية واحدة تهتم بالتفاصيل.',
    descriptionEn: 'Seven sample products. One thoughtful identity.',
  },
  {
    id: 'preview-offer-2',
    titleAr: 'مساحة للعناية، كل يوم',
    titleEn: 'A little care, every day',
    descriptionAr: 'تابع هذه المساحة لاكتشاف عروض بيو إن إل عند إطلاقها.',
    descriptionEn: 'Watch this space for Bio NL offers when they launch.',
  },
].map((o) => ({
  ...o,
  imageUrl: null,
  showInTopBanner: true,
  startDate: '2026-01-01',
  endDate: '2030-01-01',
}));

@Injectable({ providedIn: 'root' })
export class CatalogPreviewService {
  readonly enabled = CATALOG_PREVIEW;
  response(endpoint: string): unknown | undefined {
    if (!this.enabled) return undefined;
    let data: unknown;
    if (endpoint === '/products') data = previewProducts;
    else if (endpoint.startsWith('/products/')) {
      const p = previewProducts.find((p) => p.slug === decodeURIComponent(endpoint.slice(10)));
      if (!p) return undefined;
      data = { ...p, relatedProducts: previewProducts.filter((x) => x.id !== p.id).slice(0, 4) };
    } else if (endpoint === '/offers' || endpoint === '/offers/banner') data = offers;
    else return undefined;
    return {
      success: true,
      message: 'Design preview data',
      data,
      meta: { total: Array.isArray(data) ? data.length : 1 },
    };
  }
}
