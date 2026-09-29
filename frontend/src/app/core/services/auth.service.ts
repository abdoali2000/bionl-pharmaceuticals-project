import {
  Injectable, inject, signal, PLATFORM_ID
} from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from './api.service';

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: unknown;
}

/**
 * Key used in localStorage to persist the serialised admin profile.
 * Storing the profile (not a raw JWT) means we never handle tokens in
 * application code — the actual JWT lives in the HttpOnly cookie managed
 * by the browser and the backend.  The localStorage entry is used only to
 * pre-populate the signal synchronously on app startup so the auth guard
 * can make a synchronous decision without waiting for a round-trip.
 */
const ADMIN_STORAGE_KEY = 'admin_profile';
const TOKEN_STORAGE_KEY = 'auth_token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  /**
   * Signal holding the currently authenticated admin, or null when
   * unauthenticated.  Initialised synchronously from localStorage so that
   * the auth guard never sees a false-negative null on a hard reload.
   */
  readonly currentAdmin = signal<AdminProfile | null>(
    this.readStoredAdmin()
  );

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * POST /auth/login
   * Sets currentAdmin on success and persists the profile and token to localStorage.
   */
  login(payload: LoginPayload): Observable<ApiResponse<{ admin: AdminProfile; token?: string }>> {
    return this.api.post<ApiResponse<{ admin: AdminProfile; token?: string }>>('/auth/login', payload).pipe(
      tap(res => {
        if (res.success && res.data?.admin) {
          this.setAdmin(res.data.admin, res.data.token);
        }
      })
    );
  }

  /**
   * GET /auth/me
   * Validates the current session against the server and refreshes the
   * signal.  Called once by the APP_INITIALIZER at startup and never again
   * during navigation (the guard reads the signal synchronously instead).
   *
   * On 401 the local profile is cleared.  On transient network / 5xx errors
   * the stored profile is kept so the user is not logged out spuriously.
   */
  me(): Observable<ApiResponse<AdminProfile>> {
    return this.api.get<ApiResponse<AdminProfile>>('/auth/me').pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setAdmin(res.data);
        }
      }),
      catchError(err => {
        if (err?.status === 401) {
          this.clearAdmin();
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Called by APP_INITIALIZER in the background so we don't block app bootstrap.
   * Ensures the token is valid asynchronously. If 401 is received, it will 
   * clear the storage and redirect inside `me()`.
   */
  backgroundValidate(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    
    // Only attempt to validate if we actually have a stored profile/token
    if (!this.readStoredAdmin()) return;

    this.me().subscribe({
      error: () => {} // errors handled internally by me() -> clearAdmin
    });
  }

  /**
   * POST /auth/logout
   * Clears local auth state and navigates to the login page.
   */
  logout(): void {
    this.api.post<ApiResponse<null>>('/auth/logout', {}).subscribe({
      complete: () => {
        this.clearAdmin();
        this.router.navigate(['/admin/login'], { replaceUrl: true });
      },
      error: () => {
        // Clear local state even when the server call fails.
        this.clearAdmin();
        this.router.navigate(['/admin/login'], { replaceUrl: true });
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private setAdmin(admin: AdminProfile, token?: string): void {
    this.currentAdmin.set(admin);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(admin));
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    }
  }

  private clearAdmin(): void {
    // DO NOT clear on server side ever
    if (!isPlatformBrowser(this.platformId)) return;

    this.currentAdmin.set(null);
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  private readStoredAdmin(): AdminProfile | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AdminProfile) : null;
    } catch {
      return null;
    }
  }

  public getToken(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }
}
