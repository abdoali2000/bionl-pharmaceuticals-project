import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  /** Signal holding the currently authenticated admin, or null when unauthenticated. */
  readonly currentAdmin = signal<AdminProfile | null>(null);

  /**
   * POST /auth/login
   * Sets currentAdmin on success.
   */
  login(payload: LoginPayload): Observable<ApiResponse<{ admin: AdminProfile }>> {
    return this.api.post<ApiResponse<{ admin: AdminProfile }>>('/auth/login', payload).pipe(
      tap(res => {
        if (res.success && res.data?.admin) {
          this.currentAdmin.set(res.data.admin);
        }
      })
    );
  }

  /**
   * GET /auth/me
   * Refreshes currentAdmin from the server. Returns the profile observable.
   * Callers should handle errors (catchError) to treat as unauthenticated.
   *
   * IMPORTANT: Only a true 401 Unauthorized response clears the local session.
   * Transient network errors or 5xx responses do NOT destroy the auth state,
   * preventing spurious logouts due to temporary connectivity issues.
   */
  me(): Observable<ApiResponse<AdminProfile>> {
    return this.api.get<ApiResponse<AdminProfile>>('/auth/me').pipe(
      tap(res => {
        if (res.success && res.data) {
          this.currentAdmin.set(res.data);
        }
      }),
      catchError(err => {
        // Only treat an explicit 401 as "session expired/invalid"
        if (err?.status === 401) {
          this.currentAdmin.set(null);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * POST /auth/logout
   * Clears local auth state and navigates to the login page.
   */
  logout(): void {
    this.api.post<ApiResponse<null>>('/auth/logout', {}).subscribe({
      complete: () => {
        this.currentAdmin.set(null);
        this.router.navigate(['/admin/login'], { replaceUrl: true });
      },
      error: () => {
        // Even if the server call fails, clear local state and redirect.
        this.currentAdmin.set(null);
        this.router.navigate(['/admin/login'], { replaceUrl: true });
      }
    });
  }
}
