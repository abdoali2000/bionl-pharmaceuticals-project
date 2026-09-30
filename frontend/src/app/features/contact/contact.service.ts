import { Injectable, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

// ── Models ────────────────────────────────────────────────────────────────────

export interface ContactMessage {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string | null;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface ContactMessagesMeta {
  total: number;
  unreadCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta: ContactMessagesMeta | null;
}

export interface SendContactPayload {
  fullName: string;
  phoneNumber: string;
  email?: string;
  subject: string;
  message: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ContactService {
  private api = inject(ApiService);

  // ── Public signals ─────────────────────────────────────────────────────────

  /** Reactive signal for the admin inbox unread count. Updated after any list load. */
  readonly unreadCount = signal<number>(0);

  // ── Admin signals ──────────────────────────────────────────────────────────

  readonly messages = signal<ContactMessage[]>([]);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly selectedMessage = signal<ContactMessage | null>(null);

  // ── Public endpoint ────────────────────────────────────────────────────────

  /**
   * POST /contact — public, no auth required.
   * Sends a contact form submission to the backend.
   */
  sendMessage(payload: SendContactPayload): Observable<ApiResponse<null>> {
    return this.api.post<ApiResponse<null>>('/contact', payload);
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  /**
   * GET /admin/contact-messages
   * Optional query param: isRead=true|false for filtering.
   * Always updates the shared unreadCount signal from meta.
   */
  loadMessages(isRead?: boolean): Observable<ApiResponse<ContactMessage[]>> {
    this.loading.set(true);

    const params: Record<string, string | boolean> = {};
    if (isRead !== undefined) {
      params['isRead'] = isRead; // pass native boolean; Angular HttpClient serialises it as 'true'/'false'
    }

    return this.api.get<ApiResponse<ContactMessage[]>>('/admin/contact-messages', params).pipe(
      tap({
        next: res => {
          this.messages.set(res.data ?? []);
          if (res.meta != null) {
            this.unreadCount.set(res.meta.unreadCount ?? 0);
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  /**
   * Lightweight call to refresh only the unreadCount signal.
   * Called by the admin layout on init so the nav badge is populated
   * immediately, before the user visits the messages page.
   */
  fetchUnreadBadgeCount(): void {
    this.api.get<ApiResponse<ContactMessage[]>>('/admin/contact-messages').pipe(
      tap(res => {
        if (res.meta != null) {
          this.unreadCount.set(res.meta.unreadCount ?? 0);
        }
      })
    ).subscribe();
  }

  /**
   * GET /admin/contact-messages/:id
   * Auto-marks the message as read on the backend.
   * Updates the local signals so the UI reflects the change immediately.
   */
  loadMessageById(id: string): Observable<ApiResponse<ContactMessage>> {
    this.detailLoading.set(true);
    return this.api.get<ApiResponse<ContactMessage>>(`/admin/contact-messages/${id}`).pipe(
      tap({
        next: res => {
          this.selectedMessage.set(res.data);

          // Update the in-memory list so the row shows as read immediately
          // and decrement unreadCount only if the message was previously unread.
          this.messages.update(list =>
            list.map(m => {
              if (m.id === id && !m.isRead) {
                this.unreadCount.update(c => Math.max(0, c - 1));
                return { ...m, isRead: true };
              }
              return m;
            })
          );

          this.detailLoading.set(false);
        },
        error: () => this.detailLoading.set(false),
      })
    );
  }
}
