import { Component, inject, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

// PrimeNG
import { Button } from 'primeng/button';
import { Skeleton } from 'primeng/skeleton';
import { Tag } from 'primeng/tag';
import { Message } from 'primeng/message';
import { Tooltip } from 'primeng/tooltip';

import { ContactService } from '../../../../contact/contact.service';
import { LanguageService } from '../../../../../core/services/language.service';

@Component({
  selector: 'app-admin-contact-detail',
  standalone: true,
  imports: [
    CommonModule,
    Button,
    Skeleton,
    Tag,
    Message,
    Tooltip,
  ],
  styles: [`
    :host {
      display: block;
      padding: 1.5rem;
      background: #0f172a;
      min-height: 100%;
    }

    /* ── Back + header bar ───────────────────────────────────────────────── */

    .page-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .page-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
      flex: 1;
    }

    /* ── Detail card ─────────────────────────────────────────────────────── */

    .detail-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 1rem;
      overflow: hidden;
    }

    .card-header {
      padding: 1.5rem 1.75rem;
      border-bottom: 1px solid #334155;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .subject-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 0.375rem;
    }

    .card-date {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
    }

    /* ── Meta section ────────────────────────────────────────────────────── */

    .meta-section {
      padding: 1.25rem 1.75rem;
      border-bottom: 1px solid #334155;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .meta-field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .meta-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .meta-value {
      font-size: 0.9375rem;
      color: #cbd5e1;
      font-weight: 500;
    }

    .meta-value a {
      color: #818cf8;
      text-decoration: none;
    }

    .meta-value a:hover {
      text-decoration: underline;
    }

    .meta-value.empty {
      color: #475569;
      font-style: italic;
    }

    /* ── Message body ────────────────────────────────────────────────────── */

    .message-section {
      padding: 1.5rem 1.75rem;
    }

    .message-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 0.75rem;
    }

    .message-body {
      font-size: 0.9375rem;
      color: #e2e8f0;
      line-height: 1.75;
      white-space: pre-wrap;
      word-break: break-word;
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 0.625rem;
      padding: 1.25rem;
      margin: 0;
    }

    /* ── Skeleton ────────────────────────────────────────────────────────── */

    .skeleton-wrap {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `],
  template: `
    <!-- Page header -->
    <div class="page-header">
      <p-button
        icon="pi pi-arrow-left"
        [text]="true"
        [rounded]="true"
        severity="secondary"
        (click)="goBack()"
        [pTooltip]="isAr() ? 'رجوع' : 'Back'"
        tooltipPosition="top"
      />
      <h1 class="page-title">
        {{ isAr() ? 'تفاصيل الرسالة' : 'Message Detail' }}
      </h1>
    </div>

    <!-- Loading skeleton -->
    @if (contactService.detailLoading()) {
      <div class="detail-card">
        <div style="padding: 1.75rem;">
          <div class="skeleton-wrap">
            <p-skeleton height="2rem" width="60%" />
            <p-skeleton height="1rem" width="40%" />
            <p-skeleton height="1rem" width="30%" />
            <p-skeleton height="6rem" />
          </div>
        </div>
      </div>
    }

    <!-- Message not found -->
    @if (!contactService.detailLoading() && notFound()) {
      <p-message severity="error">
        {{ isAr() ? 'الرسالة غير موجودة.' : 'Message not found.' }}
      </p-message>
    }

    <!-- Detail card -->
    @if (!contactService.detailLoading() && contactService.selectedMessage(); as msg) {
      <div class="detail-card">

        <!-- Card header: subject + date + read status -->
        <div class="card-header">
          <div>
            <p class="subject-title">{{ msg.subject }}</p>
            <p class="card-date">
              {{ msg.createdAt | date: 'd MMMM yyyy, HH:mm' }}
            </p>
          </div>
          @if (msg.isRead) {
            <p-tag
              [value]="isAr() ? 'مقروءة' : 'Read'"
              severity="secondary"
              icon="pi pi-check"
            />
          } @else {
            <p-tag
              [value]="isAr() ? 'جديدة' : 'Unread'"
              severity="contrast"
              icon="pi pi-envelope"
            />
          }
        </div>

        <!-- Sender meta -->
        <div class="meta-section">
          <div class="meta-field">
            <span class="meta-label">{{ isAr() ? 'الاسم' : 'Full Name' }}</span>
            <span class="meta-value">{{ msg.fullName }}</span>
          </div>
          <div class="meta-field">
            <span class="meta-label">{{ isAr() ? 'الهاتف' : 'Phone' }}</span>
            <span class="meta-value">
              <a [href]="'tel:' + msg.phoneNumber" dir="ltr">{{ msg.phoneNumber }}</a>
            </span>
          </div>
          <div class="meta-field">
            <span class="meta-label">{{ isAr() ? 'البريد الإلكتروني' : 'Email' }}</span>
            @if (msg.email) {
              <span class="meta-value">
                <a [href]="'mailto:' + msg.email">{{ msg.email }}</a>
              </span>
            } @else {
              <span class="meta-value empty">
                {{ isAr() ? 'غير متوفر' : 'Not provided' }}
              </span>
            }
          </div>
        </div>

        <!-- Message body -->
        <div class="message-section">
          <p class="message-label">{{ isAr() ? 'نص الرسالة' : 'Message' }}</p>
          <pre class="message-body" [attr.dir]="isAr() ? 'rtl' : 'auto'">{{ msg.message }}</pre>
        </div>

      </div>
    }
  `
})
export class AdminContactDetailComponent implements OnInit {
  readonly contactService = inject(ContactService);
  private langService = inject(LanguageService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isAr = computed(() => this.langService.currentLang() === 'ar');

  notFound = () => !this.contactService.selectedMessage();

  ngOnInit(): void {
    // Only fetch authenticated data in the browser.
    // During SSR the auth cookie is absent, which would cause a 401.
    if (!isPlatformBrowser(this.platformId)) return;

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/admin/contact']);
      return;
    }

    // Clear any previously selected message so the skeleton renders cleanly
    this.contactService.selectedMessage.set(null);

    this.contactService.loadMessageById(id).subscribe({
      error: err => {
        if (err?.status === 404) {
          // Leave selectedMessage as null — notFound() will handle the display
        } else {
          // Unexpected error — navigate back to the list
          this.router.navigate(['/admin/contact']);
        }
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin/contact']);
  }
}
