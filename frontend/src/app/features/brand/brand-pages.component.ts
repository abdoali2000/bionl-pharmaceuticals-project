import { Component, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { LanguageService } from '../../core/services/language.service';
import { ProductsService } from '../products/products.service';
import { OffersService } from '../offers/offers.service';
import { ProductCardComponent } from '../../shared/components/product-card/product-card.component';
import { RevealDirective } from './reveal.directive';

@Component({
  standalone: true,
  selector: 'app-brand-pages',
  imports: [RouterLink, ProductCardComponent, RevealDirective],
  template: `
    @if (page === 'home') {
      <section class="brand-hero wrap">
        <div class="hero-copy reveal">
          <span class="eyebrow"><span class="tiny-orbit"></span> BIO NL PHARMACEUTICALS</span>
          <h1>
            {{ t('عناية تبدأ', 'Care begins') }}<br /><em>{{
              t('من التفاصيل.', 'with the details.')
            }}</em>
          </h1>
          <p>
            {{
              t(
                'لأن كل تفصيلة في يومك تستحق الاهتمام. اكتشف عالم بيو إن إل، وتعرّف على منتجاتنا عن قرب.',
                'Because the little things deserve great care. Explore the Bio NL world and find your everyday essentials.'
              )
            }}
          </p>
          <div class="hero-actions">
            <a class="brand-button" routerLink="/products"
              >{{ t('اكتشف منتجاتنا', 'Explore our products') }}
              <i class="pi pi-arrow-up-left"></i></a
            ><a class="text-link" routerLink="/about"
              >{{ t('قصة بيو إن إل', 'Our story') }} <span>↗</span></a
            >
          </div>
          <div class="hero-footnote">
            <span>01 — 07</span
            ><span>{{
              t(
                'تشكيلة مختارة. اهتمام بكل تفصيلة.',
                'A considered collection. Care in every detail.'
              )
            }}</span>
          </div>
        </div>
        <div class="hero-stage reveal" aria-label="Illustrative product collection">
          <div class="stage-orbit"></div>
          <span class="stage-word">care.</span>
          <div class="stage-disc"></div>
          <img
            class="hero-product hero-one"
            src="/brand/product-1.svg"
            alt="Pure Balance sample packaging"
            fetchpriority="high"
          /><img
            class="hero-product hero-two"
            src="/brand/product-3.svg"
            alt="Derma Calm sample packaging"
          /><span class="stage-label"
            ><i class="pi pi-sparkles"></i>
            {{ t('تفاصيل صغيرة، اهتمام كبير', 'Small details. Thoughtful care.') }}</span
          ><span class="stage-mark">BIO<br /><b>NL</b></span>
        </div>
      </section>
      <div class="promise-strip">
        <div class="wrap">
          <span
            ><i class="pi pi-heart"></i
            >{{ t('العناية في قلب ما نقدمه', 'Care at the heart') }}</span
          ><span
            ><i class="pi pi-box"></i
            >{{ t('تشكيلة سهلة الاكتشاف', 'A collection to explore') }}</span
          ><span
            ><i class="pi pi-comments"></i
            >{{ t('تواصل مباشر مع فريقنا', 'A conversation away') }}</span
          >
        </div>
      </div>
      <section class="wrap brand-section">
        <div appReveal class="section-heading">
          <div>
            <span class="eyebrow">THE COLLECTION</span>
            <h2>{{ t('اختيارات تستحق أن تعرفها.', 'Meet your new essentials.') }}</h2>
          </div>
          <a routerLink="/products" class="text-link"
            >{{ t('كل المنتجات', 'View all products') }} ↗</a
          >
        </div>
        <div class="brand-product-grid">
          @for (p of products.products().slice(0, 4); track p.id) {
            <app-product-card [product]="p" />
          }
        </div>
        @if (error()) {
          <p role="alert">
            {{ t('تعذّر تحميل المنتجات. حاول مجددًا.', 'Unable to load products. Please retry.') }}
            <button (click)="load()">{{ t('إعادة المحاولة', 'Retry') }}</button>
          </p>
        }
      </section>
      <section appReveal class="wrap story-panel">
        <div class="story-art">
          <span class="eyebrow">THE SCIENCE OF CARE</span>
          <div class="dna-art">
            <span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
          <span class="art-caption">A thoughtful approach.<br />A human connection.</span>
        </div>
        <div class="story-copy">
          <span class="eyebrow">BEHIND BIO NL</span>
          <h2>
            {{ t('نؤمن أن الاهتمام', 'We believe care') }}<br />{{
              t('يصنع الفارق.', 'makes a difference.')
            }}
          </h2>
          <p>
            {{
              t(
                'بيو إن إل مساحة تجمع منتجاتنا ومعلوماتها في مكان واحد. نساعدك على التعرف على كل منتج، ونسهّل وصولك إلى فريقنا عندما تحتاج إلى المزيد.',
                'Bio NL brings our collection and product information together. Get to know each product, and connect with our team whenever you need more information.'
              )
            }}
          </p>
          <a class="brand-button secondary" routerLink="/about"
            >{{ t('تعرّف علينا أكثر', 'Get to know us') }} ↗</a
          >
        </div>
      </section>
      <section class="wrap brand-section">
        <div appReveal class="section-heading">
          <div>
            <span class="eyebrow">A LITTLE EXTRA</span>
            <h2>{{ t('جديد يستحق المتابعة.', 'Something to look forward to.') }}</h2>
          </div>
          <a routerLink="/offers" class="text-link">{{ t('اكتشف العروض', 'Explore offers') }} ↗</a>
        </div>
        <div class="offer-editorial">
          <div>
            <span class="pill">{{ t('اكتشف بيو إن إل', 'DISCOVER BIO NL') }}</span>
            <h3>
              {{ t('عالم من العناية،', 'A world of care,') }}<br />{{
                t('أقرب إليك.', 'closer to you.')
              }}
            </h3>
            <a routerLink="/products" class="text-link"
              >{{ t('تصفّح التشكيلة', 'Explore the collection') }} ↗</a
            >
          </div>
          <img src="/brand/product-4.svg" alt="Bright C sample product" loading="lazy" /><span
            class="offer-watermark"
            >BIO NL</span
          >
        </div>
      </section>
    } @else if (page === 'products') {
      <section appReveal class="wrap page-intro">
        <span class="eyebrow">THE BIO NL COLLECTION</span>
        <h1>{{ t('عناية تناسب يومك.', 'Care for your everyday.') }}</h1>
        <p>
          {{
            t(
              'تعرّف على التشكيلة كاملة. اختر منتجًا لاكتشاف تفاصيله.',
              'Explore the whole collection. Choose a product to discover the details.'
            )
          }}
        </p>
        <span class="collection-count"
          >{{ products.products().length }}
          {{ t('منتجات في تشكيلتنا', 'products in our collection') }}</span
        >
      </section>
      <section class="wrap brand-section collection-section">
        <div class="brand-product-grid">
          @for (p of products.products(); track p.id) {
            <app-product-card [product]="p" />
          }
        </div>
        @if (products.loadingProducts()) {
          <p>{{ t('جارٍ تحميل التشكيلة…', 'Loading the collection…') }}</p>
        }
        @if (error()) {
          <p role="alert">
            {{ t('تعذر تحميل التشكيلة', 'Unable to load the collection') }}
            <button (click)="load()">{{ t('إعادة المحاولة', 'Retry') }}</button>
          </p>
        }
        @if (!products.loadingProducts() && !products.products().length && !error()) {
          <div class="empty-brand">
            {{ t('المنتجات الجديدة ستظهر هنا قريبًا.', 'New products will appear here soon.') }}
          </div>
        }
      </section>
    } @else if (page === 'about') {
      <section appReveal class="wrap page-intro">
        <span class="eyebrow">OUR WORLD</span>
        <h1>
          {{ t('الاهتمام بالتفاصيل.', 'Thoughtful by nature.') }}<br /><em>{{
            t('هو نقطة البداية.', 'Human at heart.')
          }}</em>
        </h1>
        <p>
          {{
            t(
              'تعرّف على بيو إن إل، وعلى الفكرة وراء تجربة أقرب وأبسط.',
              'Get to know Bio NL and the idea behind a simpler, more connected experience.'
            )
          }}
        </p>
      </section>
      <section appReveal class="wrap story-panel">
        <div class="about-logo">
          <img src="/brand/logo.png" alt="Bio NL Pharmaceuticals logo" /><span
            >BIO NL PHARMACEUTICALS</span
          >
        </div>
        <div class="story-copy">
          <span class="eyebrow">HELLO, WE ARE BIO NL</span>
          <h2>
            {{ t('مكان واحد،', 'One place,') }}<br />{{
              t('لمنتجاتنا ولك.', 'for our products and you.')
            }}
          </h2>
          <p>
            {{
              t(
                'هنا يمكنك استكشاف منتجات بيو إن إل، وقراءة المعلومات المتاحة عن كل منتج، والتواصل مع الفريق بشأن أي استفسار. نؤمن أن الوصول إلى المعلومة يجب أن يكون واضحًا وبسيطًا.',
                'Explore Bio NL products, read available product information, and contact the team with questions. We believe information should be clear and easy to reach.'
              )
            }}
          </p>
          <a class="brand-button" routerLink="/contact"
            >{{ t('ابدأ محادثة معنا', 'Start a conversation') }} ↗</a
          >
        </div>
      </section>
      <section class="wrap brand-section">
        <div appReveal class="section-heading">
          <div>
            <span class="eyebrow">WHAT MATTERS</span>
            <h2>{{ t('ثلاث أفكار تقرّبنا منك.', 'Three ideas that bring us closer.') }}</h2>
          </div>
        </div>
        <div appReveal class="value-grid">
          @for (v of values; track v.en) {
            <article>
              <span class="value-number">0{{ $index + 1 }}</span
              ><i [class]="'pi ' + v.icon"></i>
              <h3>{{ t(v.ar, v.en) }}</h3>
              <p>{{ t(v.bodyAr, v.bodyEn) }}</p>
            </article>
          }
        </div>
        <p class="content-note">
          {{
            t(
              'تفاصيل تاريخ الشركة وفريق العمل ستُضاف بعد اعتماد المحتوى الرسمي.',
              'Company history and team details will be added after official content approval.'
            )
          }}
        </p>
      </section>
    } @else if (page === 'offers') {
      <section appReveal class="wrap page-intro">
        <span class="eyebrow">A LITTLE EXTRA CARE</span>
        <h1>{{ t('مساحة للمفاجآت اللطيفة.', 'A little something extra.') }}</h1>
        <p>
          {{
            t(
              'تابع جديد بيو إن إل وعروضنا المتاحة في مكان واحد.',
              'Discover what is new and explore available Bio NL offers.'
            )
          }}
        </p>
      </section>
      <section class="wrap brand-section">
        <div appReveal class="brand-offer-grid">
          @for (o of offers.offers(); track o.id) {
            <article appReveal class="brand-offer">
              <span class="pill">{{ t('من بيو إن إل', 'FROM BIO NL') }}</span>
              <h2>{{ t(o.titleAr, o.titleEn) }}</h2>
              <p>{{ t(o.descriptionAr || '', o.descriptionEn || '') }}</p>
              @if (o.imageUrl) {
                <img [src]="o.imageUrl" [alt]="t(o.titleAr, o.titleEn)" />
              }
              <a class="brand-button secondary" routerLink="/products"
                >{{ t('اكتشف المنتجات', 'Discover products') }} ↗</a
              >
            </article>
          } @empty {
            <div class="empty-brand">
              <i class="pi pi-gift"></i>
              <h2>{{ t('الجديد قادم، خليك قريب.', 'Good things are on the way.') }}</h2>
              <a routerLink="/products">{{
                t('اكتشف التشكيلة الحالية', 'Explore the collection')
              }}</a>
            </div>
          }
        </div>
      </section>
    } @else {
      <section appReveal class="wrap page-intro">
        <span class="eyebrow">404</span>
        <h1>{{ t('يبدو أنك وصلت لمكان آخر.', 'A little off the path.') }}</h1>
        <p>
          {{
            t(
              'الصفحة المطلوبة غير موجودة. دعنا نعيدك إلى البداية.',
              'This page could not be found. Let us take you back.'
            )
          }}
        </p>
        <a class="brand-button" routerLink="/">{{ t('العودة للرئيسية', 'Back to home') }} ↗</a>
      </section>
    }
    @if (page !== 'missing') {
      <section appReveal class="wrap contact-ribbon">
        <div>
          <span class="eyebrow">LET’S TALK</span>
          <h2>{{ t('في بالك سؤال؟', 'Something on your mind?') }}</h2>
          <p>
            {{
              t('فريقنا هنا ليساعدك في معرفة المزيد.', 'Our team is here to help you learn more.')
            }}
          </p>
        </div>
        <a class="brand-button" routerLink="/contact">{{ t('تواصل معنا', 'Get in touch') }} ↗</a>
      </section>
    }
  `,
})
export class BrandPagesComponent {
  private route = inject(ActivatedRoute);
  readonly lang = inject(LanguageService);
  readonly products = inject(ProductsService);
  readonly offers = inject(OffersService);
  readonly error = signal(false);
  readonly page = this.route.snapshot.data['page'] || 'home';
  readonly values = [
    {
      ar: 'وضوح المعلومة',
      en: 'Clarity',
      icon: 'pi-eye',
      bodyAr: 'تفاصيل مرتبة تساعدك على التعرف على كل منتج.',
      bodyEn: 'Organized details to help you get to know every product.',
    },
    {
      ar: 'اهتمام حقيقي',
      en: 'Thoughtfulness',
      icon: 'pi-heart',
      bodyAr: 'تجربة تراعي وقتك واحتياجك إلى إجابات واضحة.',
      bodyEn: 'An experience that respects your time and your questions.',
    },
    {
      ar: 'تواصل أقرب',
      en: 'Connection',
      icon: 'pi-comments',
      bodyAr: 'قناة مباشرة للأسئلة والاستفسارات حول منتجاتنا.',
      bodyEn: 'A direct channel for questions about our collection.',
    },
  ];
  constructor() {
    inject(Title).setTitle(
      `${this.page === 'home' ? 'Bio NL Pharmaceuticals' : this.page.charAt(0).toUpperCase() + this.page.slice(1) + ' | Bio NL'}`,
    );
    inject(Meta).updateTag({
      name: 'description',
      content:
        'Explore Bio NL Pharmaceuticals, our collection and product information. Discover thoughtful care and connect with our team.',
    });
    this.load();
  }
  t(ar: string, en: string) {
    return this.lang.currentLang() === 'ar' ? ar : en;
  }
  load() {
    this.error.set(false);
    if (['home', 'products'].includes(this.page))
      this.products.loadProducts().subscribe({ error: () => this.error.set(true) });
    if (['home', 'offers'].includes(this.page))
      this.offers.loadOffers().subscribe({ error: () => this.error.set(true) });
  }
}
