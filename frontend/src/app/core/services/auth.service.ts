import {
  Injectable, inject, signal, PLATFORM_ID
} from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, of, map } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from './api.service';

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  createdAt?: string;
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);

  /** Server-validated admin session state. The JWT stays in an HttpOnly cookie. */
  readonly currentAdmin = signal<AdminProfile | null>(null);

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * POST /auth/login
   * Sets the in-memory profile on success. Authentication remains cookie-based.
   */
  login(payload: LoginPayload): Observable<ApiResponse<{ admin: AdminProfile }>> {
    return this.api.post<ApiResponse<{ admin: AdminProfile }>>('/auth/login', payload).pipe(
      tap(res => {
        if (res.success && res.data?.admin) {
          this.setAdmin(res.data.admin);
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
          this.clearSession();
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Resolves after asking the server whether the HttpOnly-cookie session is valid.
   * A browser reload therefore never trusts a profile saved by client code.
   */
  restoreSession(): Observable<boolean> {
    if (!isPlatformBrowser(this.platformId)) return of(false);

    return this.me().pipe(
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      }),
    );
  }

  /**
   * POST /auth/logout
   * Clears local auth state and navigates to the login page.
   */
  logout(): void {
    this.api.post<ApiResponse<null>>('/auth/logout', {}).subscribe({
      complete: () => {
        this.clearSession();
        this.router.navigate(['/admin/login'], { replaceUrl: true });
      },
      error: () => {
        // Clear local state even when the server call fails.
        this.clearSession();
        this.router.navigate(['/admin/login'], { replaceUrl: true });
      }
    });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private setAdmin(admin: AdminProfile): void {
    this.currentAdmin.set(admin);
  }

  clearSession(): void {
    this.currentAdmin.set(null);
  }
}
