import { Component, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { LanguageService } from '../../core/services/language.service';
@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `<section class="dashboard-intro">
      <span class="eyebrow">BIO NL / ADMINISTRATION</span>
      <h1>{{ t('نظرة على كل التفاصيل', 'Every detail, at a glance') }}</h1>
      <p>
        {{
          t(
            'أهلًا بك. من هنا تبدأ إدارة محتوى بيو إن إل.',
            'Welcome back. Your Bio NL workspace starts here.'
          )
        }}
      </p>
    </section>
    <div class="dashboard-stats">
      @for (s of stats(); track s.path) {
        <a class="dashboard-stat" [routerLink]="s.path"
          ><i [class]="'pi ' + s.icon"></i><strong>{{ s.value }}</strong
          ><span>{{ t(s.ar, s.en) }} ↗</span></a
        >
      }
    </div>
    @if (error()) {
      <p role="alert" class="dashboard-status">
        {{
          t(
            'بعض الإحصائيات غير متاحة. تحقق من اتصال الخادم أو أعد تسجيل الدخول.',
            'Some statistics are unavailable. Check the API connection or sign in again.'
          )
        }}
      </p>
    }
    <div class="dashboard-links">
      <a class="brand-button" routerLink="/admin/products/create"
        >{{ t('أضف منتجًا', 'Add a product') }} +</a
      ><a class="brand-button secondary" routerLink="/admin/offers/new"
        >{{ t('عرض جديد', 'New offer') }} +</a
      ><a class="brand-button secondary" routerLink="/"
        >{{ t('زيارة الموقع', 'Visit website') }} ↗</a
      >
    </div>`,
})
export class DashboardComponent {
  readonly lang = inject(LanguageService);
  readonly error = signal(false);
  readonly stats = signal([
    { ar: 'المنتجات', en: 'Products', path: '/admin/products', icon: 'pi-box', value: '—' },
    { ar: 'التصنيفات', en: 'Categories', path: '/admin/categories', icon: 'pi-tags', value: '—' },
    { ar: 'الطلبات', en: 'Orders', path: '/admin/orders', icon: 'pi-shopping-bag', value: '—' },
    {
      ar: 'الرسائل غير المقروءة',
      en: 'Unread messages',
      path: '/admin/contact',
      icon: 'pi-envelope',
      value: '—',
    },
  ]);
  constructor() {
    const api = inject(ApiService);
    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      ['/admin/products', '/categories', '/admin/orders', '/admin/contact-messages'].forEach(
        (endpoint, index) =>
          api
            .get<any>(endpoint)
            .subscribe({
              next: (r) =>
                this.stats.update((rows) =>
                  rows.map((row, i) =>
                    i === index
                      ? {
                          ...row,
                          value: String(
                            index === 3
                              ? (r.meta?.unreadCount ?? 0)
                              : (r.meta?.total ?? r.data?.length ?? 0),
                          ),
                        }
                      : row,
                  ),
                ),
              error: () => this.error.set(true),
            }),
      );
    }
  }
  t(ar: string, en: string) {
    return this.lang.currentLang() === 'ar' ? ar : en;
  }
}
