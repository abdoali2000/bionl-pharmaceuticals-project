import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { LanguageService } from '../../core/services/language.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet],
  styles: [`
    .admin-shell {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
      background: #0f172a;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.875rem 1.5rem;
      background: #1e293b;
      border-bottom: 1px solid #334155;
    }

    .admin-brand {
      font-size: 1.125rem;
      font-weight: 700;
      color: #f1f5f9;
    }

    .admin-brand span {
      color: #6366f1;
    }

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

    .admin-content {
      flex: 1;
      padding: 1.5rem;
    }
  `],
  template: `
    <div class="admin-shell">
      <header class="admin-header">
        <div class="admin-brand">Bio<span>NL</span> Admin</div>
        <div class="admin-actions">
          @if (authService.currentAdmin(); as admin) {
            <span class="admin-user">{{ admin.fullName || admin.email }}</span>
          }
          <button
            class="logout-btn"
            type="button"
            (click)="authService.logout()"
          >
            {{ langService.currentLang() === 'ar' ? 'تسجيل الخروج' : 'Logout' }}
          </button>
        </div>
      </header>
      <main class="admin-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class AdminLayoutComponent {
  readonly authService = inject(AuthService);
  readonly langService = inject(LanguageService);
}
