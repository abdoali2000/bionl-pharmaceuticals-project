import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl
} from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { LanguageService } from '../../../core/services/language.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styles: [`
    :host {
      display: flex;
      min-height: 100dvh;
      align-items: center;
      justify-content: center;
      background: #0f172a;
      padding: 1.5rem;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    .login-card {
      width: 100%;
      max-width: 420px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 1rem;
      padding: 2.5rem 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-logo {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .login-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 0.25rem;
    }

    .login-subtitle {
      font-size: 0.875rem;
      color: #94a3b8;
      margin: 0;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #cbd5e1;
      margin-bottom: 0.5rem;
    }

    input {
      width: 100%;
      padding: 0.875rem 1rem;
      font-size: 1rem;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 0.5rem;
      color: #f1f5f9;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      box-sizing: border-box;
      min-height: 48px; /* Mobile tap target */
    }

    input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
    }

    input.invalid {
      border-color: #ef4444;
    }

    .field-error {
      margin-top: 0.375rem;
      font-size: 0.8rem;
      color: #f87171;
    }

    .server-error {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      color: #f87171;
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
      text-align: center;
    }

    .submit-btn {
      width: 100%;
      padding: 0.875rem 1rem;
      font-size: 1rem;
      font-weight: 600;
      background: #6366f1;
      color: #fff;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: background 0.2s, opacity 0.2s;
      min-height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .submit-btn:hover:not(:disabled) {
      background: #4f46e5;
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .lang-toggle {
      text-align: center;
      margin-top: 1.5rem;
    }

    .lang-btn {
      background: none;
      border: 1px solid #475569;
      border-radius: 0.5rem;
      color: #94a3b8;
      font-size: 0.8125rem;
      padding: 0.375rem 0.75rem;
      cursor: pointer;
      transition: border-color 0.2s, color 0.2s;
    }

    .lang-btn:hover {
      border-color: #6366f1;
      color: #c7d2fe;
    }
  `],
  template: `
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">💊</div>
        <h1 class="login-title">{{ labels().title }}</h1>
        <p class="login-subtitle">{{ labels().subtitle }}</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <!-- Server-side error -->
        @if (serverError()) {
          <div class="server-error" role="alert">{{ serverError() }}</div>
        }

        <!-- Email field -->
        <div class="form-group">
          <label for="email">{{ labels().emailLabel }}</label>
          <input
            id="email"
            type="email"
            inputmode="email"
            autocomplete="username"
            formControlName="email"
            [class.invalid]="isInvalid('email')"
            [placeholder]="labels().emailPlaceholder"
          />
          @if (isInvalid('email')) {
            <p class="field-error">{{ labels().emailError }}</p>
          }
        </div>

        <!-- Password field -->
        <div class="form-group">
          <label for="password">{{ labels().passwordLabel }}</label>
          <input
            id="password"
            type="password"
            inputmode="text"
            autocomplete="current-password"
            formControlName="password"
            [class.invalid]="isInvalid('password')"
            [placeholder]="labels().passwordPlaceholder"
          />
          @if (isInvalid('password')) {
            <p class="field-error">{{ labels().passwordError }}</p>
          }
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="submit-btn"
          [disabled]="loading()"
        >
          @if (loading()) {
            <span class="spinner"></span>
          }
          {{ loading() ? labels().loadingText : labels().submitText }}
        </button>
      </form>

      <!-- Language toggle -->
      <div class="lang-toggle">
        <button class="lang-btn" type="button" (click)="langService.toggleLanguage()">
          {{ langService.currentLang() === 'ar' ? 'English' : 'عربي' }}
        </button>
      </div>
    </div>
  `
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  readonly langService = inject(LanguageService);

  loading = signal(false);
  serverError = signal<string | null>(null);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  /** The URL to return to after a successful login. Defaults to /admin/dashboard. */
  private get returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') ?? '/admin/dashboard';
  }

  /** Bilingual labels derived from the current language signal. */
  labels = () => {
    const ar = this.langService.currentLang() === 'ar';
    return {
      title:               ar ? 'لوحة التحكم'          : 'Admin Dashboard',
      subtitle:            ar ? 'تسجيل دخول المشرفين'  : 'Administrator Sign In',
      emailLabel:          ar ? 'البريد الإلكتروني'    : 'Email Address',
      emailPlaceholder:    ar ? 'أدخل بريدك الإلكتروني': 'Enter your email',
      emailError:          ar ? 'بريد إلكتروني غير صالح': 'Enter a valid email address',
      passwordLabel:       ar ? 'كلمة المرور'           : 'Password',
      passwordPlaceholder: ar ? 'أدخل كلمة المرور'     : 'Enter your password',
      passwordError:       ar ? 'الحد الأدنى 6 أحرف'   : 'Minimum 6 characters required',
      submitText:          ar ? 'تسجيل الدخول'          : 'Sign In',
      loadingText:         ar ? 'جارٍ التحقق...'        : 'Signing in...'
    };
  };

  isInvalid(field: string): boolean {
    const ctrl: AbstractControl | null = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.serverError.set(null);

    const { email, password } = this.form.getRawValue();

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: () => {
        this.loading.set(false);
        // Navigate to the originally requested URL, or fall back to /admin/dashboard.
        this.router.navigate([this.returnUrl], { replaceUrl: true });
      },
      error: (err) => {
        this.loading.set(false);
        const lang = this.langService.currentLang();
        const serverMsg = err?.error?.message;
        if (serverMsg) {
          this.serverError.set(serverMsg);
        } else {
          this.serverError.set(
            lang === 'ar'
              ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
              : 'Invalid email or password'
          );
        }
      }
    });
  }
}
