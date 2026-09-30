import { Component, inject, computed, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { Router } from '@angular/router';

// PrimeNG
import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';
import { Tag } from 'primeng/tag';
import { Skeleton } from 'primeng/skeleton';
import { Tooltip } from 'primeng/tooltip';
import { SelectButton } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';

import { ContactService, ContactMessage } from '../../../../contact/contact.service';
import { LanguageService } from '../../../../../core/services/language.service';

type FilterOption = 'all' | 'unread';

@Component({
  selector: 'app-admin-contact-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    Button,
    Tag,
    Skeleton,
    Tooltip,
    SelectButton,
  ],
  styles: [`
    :host {
      display: block;
      padding: 1.5rem;
      background: #0f172a;
      min-height: 100%;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.75rem;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0.25rem 0 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    /* ── Unread badge in page title area ─────────────────────────────────── */

    .unread-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 22px;
      height: 22px;
      padding: 0 6px;
      border-radius: 11px;
      background: #ef4444;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      line-height: 1;
      vertical-align: middle;
      margin-inline-start: 0.5rem;
    }

    /* ── Table card ──────────────────────────────────────────────────────── */

    .table-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.875rem;
      overflow: hidden;
    }

    .sender-col {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
    }

    .sender-name {
      font-weight: 600;
      color: #f1f5f9;
      font-size: 0.9375rem;
    }

    .sender-name.unread {
      color: #818cf8;
    }

    .sender-contact {
      font-size: 0.8125rem;
      color: #64748b;
    }

    .subject-cell {
      font-size: 0.9rem;
      color: #cbd5e1;
      font-weight: 500;
    }

    .subject-cell.unread {
      color: #f1f5f9;
      font-weight: 600;
    }

    .date-cell {
      font-size: 0.875rem;
      color: #94a3b8;
      white-space: nowrap;
    }

    .actions-cell {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* ── Skeleton ────────────────────────────────────────────────────────── */

    .skeleton-wrap {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    /* ── Empty state ─────────────────────────────────────────────────────── */

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem 1rem;
      gap: 1rem;
    }

    .empty-icon {
      font-size: 2.5rem;
    }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #94a3b8;
      margin: 0;
    }

    .empty-text {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0;
      text-align: center;
    }

    /* ── Unread row highlight ─────────────────────────────────────────────── */

    :host ::ng-deep tr.unread-row {
      background: rgba(99, 102, 241, 0.04) !important;
      border-left: 3px solid #6366f1;
    }

    :host ::ng-deep tr.read-row {
      border-left: 3px solid transparent;
    }
  `],
  template: `
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ isAr() ? 'رسائل التواصل' : 'Contact Messages' }}
          @if (contactService.unreadCount() > 0) {
            <span class="unread-badge">{{ contactService.unreadCount() }}</span>
          }
        </h1>
        <p class="page-subtitle">
          {{ isAr()
              ? 'إجمالي: ' + contactService.messages().length + ' رسالة'
              : contactService.messages().length + ' messages total'
          }}
        </p>
      </div>

      <div class="header-right">
        <!-- Filter toggle: All / Unread -->
        <p-selectbutton
          [options]="filterOptions()"
          [(ngModel)]="activeFilter"
          optionLabel="label"
          optionValue="value"
          (ngModelChange)="onFilterChange()"
        />
        <!-- Refresh button -->
        <p-button
          icon="pi pi-refresh"
          [outlined]="true"
          [rounded]="true"
          [pTooltip]="isAr() ? 'تحديث' : 'Refresh'"
          tooltipPosition="top"
          (click)="load()"
          [loading]="contactService.loading()"
        />
      </div>
    </div>

    <!-- Table card -->
    <div class="table-card">
      @if (contactService.loading()) {
        <div class="skeleton-wrap">
          @for (n of [1,2,3,4,5]; track n) {
            <p-skeleton height="3.5rem" />
          }
        </div>
      } @else {
        <p-table
          [value]="contactService.messages()"
          [paginator]="contactService.messages().length > 15"
          [rows]="15"
          [rowsPerPageOptions]="[15, 30, 50]"
          sortField="createdAt"
          [sortOrder]="-1"
          styleClass="p-datatable-sm"
          [tableStyle]="{ 'min-width': '48rem' }"
        >
          <ng-template #header>
            <tr>
              <th style="width: 40px"></th>
              <th [pSortableColumn]="isAr() ? 'fullName' : 'fullName'">
                {{ isAr() ? 'المُرسِل' : 'Sender' }}
                <p-sort-icon field="fullName" />
              </th>
              <th>{{ isAr() ? 'الموضوع' : 'Subject' }}</th>
              <th pSortableColumn="createdAt" style="width: 140px">
                {{ isAr() ? 'التاريخ' : 'Date' }}
                <p-sort-icon field="createdAt" />
              </th>
              <th style="width: 90px; text-align: center">
                {{ isAr() ? 'الحالة' : 'Status' }}
              </th>
              <th style="width: 80px; text-align: center">
                {{ isAr() ? 'عرض' : 'View' }}
              </th>
            </tr>
          </ng-template>

          <ng-template #body let-msg>
            <tr [class]="msg.isRead ? 'read-row' : 'unread-row'">
              <!-- Unread indicator dot -->
              <td style="text-align: center; padding-inline: 0.5rem">
                @if (!msg.isRead) {
                  <span
                    style="
                      display: inline-block;
                      width: 8px; height: 8px;
                      border-radius: 50%;
                      background: #6366f1;
                    "
                  ></span>
                }
              </td>

              <!-- Sender -->
              <td>
                <div class="sender-col">
                  <span class="sender-name" [class.unread]="!msg.isRead">
                    {{ msg.fullName }}
                  </span>
                  <span class="sender-contact">
                    {{ msg.phoneNumber }}
                    @if (msg.email) {
                      &nbsp;·&nbsp;{{ msg.email }}
                    }
                  </span>
                </div>
              </td>

              <!-- Subject -->
              <td>
                <span class="subject-cell" [class.unread]="!msg.isRead">
                  {{ msg.subject }}
                </span>
              </td>

              <!-- Date -->
              <td>
                <span class="date-cell">
                  {{ msg.createdAt | date: 'd MMM yyyy, HH:mm' }}
                </span>
              </td>

              <!-- Read/Unread tag -->
              <td style="text-align: center">
                @if (msg.isRead) {
                  <p-tag
                    [value]="isAr() ? 'مقروءة' : 'Read'"
                    severity="secondary"
                  />
                } @else {
                  <p-tag
                    [value]="isAr() ? 'جديدة' : 'Unread'"
                    severity="contrast"
                  />
                }
              </td>

              <!-- View action -->
              <td style="text-align: center">
                <p-button
                  icon="pi pi-eye"
                  [rounded]="true"
                  [text]="true"
                  severity="info"
                  (click)="viewMessage(msg)"
                  [pTooltip]="isAr() ? 'عرض الرسالة' : 'View message'"
                  tooltipPosition="top"
                />
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="6">
                <div class="empty-state">
                  <span class="empty-icon">📭</span>
                  <p class="empty-title">
                    {{
                      activeFilter === 'unread'
                        ? (isAr() ? 'لا توجد رسائل غير مقروءة' : 'No unread messages')
                        : (isAr() ? 'لا توجد رسائل بعد' : 'No messages yet')
                    }}
                  </p>
                  <p class="empty-text">
                    {{
                      activeFilter === 'unread'
                        ? (isAr() ? 'جميع الرسائل تمت قراءتها.' : 'All messages have been read.')
                        : (isAr() ? 'ستظهر رسائل التواصل هنا.' : 'Contact messages will appear here.')
                    }}
                  </p>
                </div>
              </td>
            </tr>
          </ng-template>
        </p-table>
      }
    </div>
  `
})
export class AdminContactListComponent implements OnInit {
  readonly contactService = inject(ContactService);
  private langService = inject(LanguageService);
  private router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isAr = computed(() => this.langService.currentLang() === 'ar');

  activeFilter: FilterOption = 'all';

  readonly filterOptions = computed(() => [
    { label: this.isAr() ? 'الكل' : 'All',       value: 'all' },
    { label: this.isAr() ? 'غير مقروءة' : 'Unread', value: 'unread' },
  ]);

  ngOnInit(): void {
    // Only fetch authenticated data in the browser.
    // During SSR the auth cookie is absent, which would cause a 401.
    if (isPlatformBrowser(this.platformId)) {
      this.load();
    }
  }

  load(): void {
    const isRead = this.activeFilter === 'unread' ? false : undefined;
    this.contactService.loadMessages(isRead).subscribe();
  }

  onFilterChange(): void {
    // ngModelChange fires after activeFilter has already been updated by the
    // two-way binding, so we can read this.activeFilter directly and safely.
    this.load();
  }

  viewMessage(msg: ContactMessage): void {
    this.router.navigate(['/admin/contact', msg.id]);
  }
}
