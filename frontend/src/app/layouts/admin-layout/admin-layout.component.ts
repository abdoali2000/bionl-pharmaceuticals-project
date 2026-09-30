import { Component, inject, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';
import { ContactService } from '../../features/contact/contact.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [`
    .admin-shell {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
      background: #0f172a;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    /* ── Top header ──────────────────────────────────────────────────────── */

    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1.5rem;
      background: #1e293b;
      border-bottom: 1px solid #334155;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .admin-header-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .admin-brand {
      font-size: 1.125rem;
      font-weight: 700;
      color: #f1f5f9;
      text-decoration: none;
    }

    .admin-brand span {
      color: #6366f1;
    }

    /* ── Top nav links ─────────────────────────────────────────────────── */

    .admin-nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4375rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #94a3b8;
      text-decoration: none;
      transition: background 0.15s, color 0.15s;
      position: relative;
    }

    .nav-link:hover {
      background: rgba(99, 102, 241, 0.08);
      color: #c7d2fe;
    }

    .nav-link.active-link {
      background: rgba(99, 102, 241, 0.15);
      color: #818cf8;
    }

    .nav-link i {
      font-size: 1rem;
    }

    /* ── Unread badge ─────────────────────────────────────────────────────── */

    .unread-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: 9px;
      background: #ef4444;
      color: #fff;
      font-size: 0.6875rem;
      font-weight: 700;
      line-height: 1;
    }

    /* ── Header right actions ─────────────────────────────────────────── */

    .admin-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .admin-user {
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .logout-btn {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
      font-weight: 500;
      background: transparent;
      border: 1px solid #475569;
      border-radius: 0.5rem;
      color: #94a3b8;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s;
      min-height: 40px;
    }

    .logout-btn:hover {
      border-color: #ef4444;
      color: #f87171;
    }

    /* ── Main content ─────────────────────────────────────────────────── */

    .admin-content {
      flex: 1;
      padding: 1.5rem;
    }

    /* ── Responsive: hide nav labels on very small screens ────────────── */

    @media (max-width: 640px) {
      .nav-label { display: none; }
      .admin-nav { gap: 0.125rem; }
      .nav-link { padding: 0.5rem; }
    }
  `],
  template: `
    <div class="admin-shell">
      <header class="admin-header">
        <div class="admin-header-left">
          <a class="admin-brand" routerLink="/admin/dashboard">Bio<span>NL</span> Admin</a>

          <nav class="admin-nav" [attr.dir]="isAr() ? 'rtl' : 'ltr'">
            <a
              class="nav-link"
              routerLink="/admin/dashboard"
              routerLinkActive="active-link"
            >
              <i class="pi pi-th-large"></i>
              <span class="nav-label">{{ isAr() ? 'لوحة التحكم' : 'Dashboard' }}</span>
            </a>

            <a
              class="nav-link"
              routerLink="/admin/products"
              routerLinkActive="active-link"
            >
              <i class="pi pi-box"></i>
              <span class="nav-label">{{ isAr() ? 'المنتجات' : 'Products' }}</span>
            </a>

            <a
              class="nav-link"
              routerLink="/admin/categories"
              routerLinkActive="active-link"
            >
              <i class="pi pi-tags"></i>
              <span class="nav-label">{{ isAr() ? 'الفئات' : 'Categories' }}</span>
            </a>

            <a
              class="nav-link"
              routerLink="/admin/offers"
              routerLinkActive="active-link"
            >
              <i class="pi pi-percentage"></i>
              <span class="nav-label">{{ isAr() ? 'العروض' : 'Offers' }}</span>
            </a>

            <a
              class="nav-link"
              routerLink="/admin/contact"
              routerLinkActive="active-link"
            >
              <i class="pi pi-envelope"></i>
              <span class="nav-label">{{ isAr() ? 'الرسائل' : 'Messages' }}</span>
              @if (contactService.unreadCount() > 0) {
                <span class="unread-badge">{{ contactService.unreadCount() }}</span>
              }
            </a>
          </nav>
        </div>

        <div class="admin-actions">
          @if (authService.currentAdmin(); as admin) {
            <span class="admin-user">{{ admin.fullName || admin.email }}</span>
          }
          <button
            class="logout-btn"
            type="button"
            (click)="authService.logout()"
          >
            {{ isAr() ? 'تسجيل الخروج' : 'Logout' }}
          </button>
        </div>
      </header>

      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AdminLayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly langService = inject(LanguageService);
  readonly contactService = inject(ContactService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isAr = () => this.langService.currentLang() === 'ar';

  ngOnInit(): void {
    // Only fetch the unread badge count in the browser.
    // During SSR there is no auth cookie, so the request would return 401.
    if (isPlatformBrowser(this.platformId)) {
      this.contactService.fetchUnreadBadgeCount();
    }
  }
}
