import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';

// PrimeNG
import { InputText } from 'primeng/inputtext';
import { Textarea } from 'primeng/textarea';
import { Button } from 'primeng/button';
import { Message } from 'primeng/message';

import { ContactService } from '../../contact.service';
import { LanguageService } from '../../../../core/services/language.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputText,
    Textarea,
    Button,
    Message,
  ],
  styles: [`
    :host {
      display: block;
    }

    .contact-page {
      min-height: 80vh;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      padding: 3rem 1rem;
      font-family: 'Segoe UI', system-ui, sans-serif;
    }

    .contact-container {
      max-width: 640px;
      margin: 0 auto;
    }

    /* ── Header ────────────────────────────────────────────────────────────── */

    .contact-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .contact-header .icon-wrap {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      margin-bottom: 1.25rem;
    }

    .contact-header .icon-wrap i {
      font-size: 1.75rem;
      color: #818cf8;
    }

    .contact-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0 0 0.5rem;
    }

    .contact-header p {
      font-size: 1rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.6;
    }

    /* ── Card ─────────────────────────────────────────────────────────────── */

    .contact-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 1rem;
      padding: 2rem;
    }

    /* ── Form ─────────────────────────────────────────────────────────────── */

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    .form-field.full-width {
      grid-column: 1 / -1;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #cbd5e1;
    }

    .required-star {
      color: #f87171;
      margin-inline-start: 2px;
    }

    .field-error {
      font-size: 0.8125rem;
      color: #f87171;
      margin-top: 0.25rem;
    }

    .form-input {
      width: 100%;
    }

    .form-actions {
      margin-top: 1.75rem;
    }

    .submit-btn {
      width: 100%;
    }

    /* ── Success state ─────────────────────────────────────────────────────── */

    .success-state {
      text-align: center;
      padding: 2rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .success-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(52, 211, 153, 0.15);
      border: 1px solid rgba(52, 211, 153, 0.3);
    }

    .success-icon i {
      font-size: 2rem;
      color: #34d399;
    }

    .success-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #f1f5f9;
      margin: 0;
    }

    .success-text {
      font-size: 1rem;
      color: #94a3b8;
      margin: 0;
      line-height: 1.6;
    }

    /* ── Responsive ────────────────────────────────────────────────────────── */

    @media (max-width: 540px) {
      .contact-card {
        padding: 1.5rem 1rem;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-field.full-width {
        grid-column: 1;
      }
    }
  `],
  template: `
    <div class="contact-page">
      <div class="contact-container">

        <!-- Page header -->
        <div class="contact-header">
          <div class="icon-wrap">
            <i class="pi pi-envelope"></i>
          </div>
          <h1>{{ isAr() ? 'تواصل معنا' : 'Contact Us' }}</h1>
          <p>
            {{
              isAr()
                ? 'يسعدنا الرد على استفساراتك. أرسل لنا رسالتك وسنتواصل معك في أقرب وقت.'
                : "We'd love to hear from you. Send us a message and we'll get back to you as soon as possible."
            }}
          </p>
        </div>

        <!-- Card -->
        <div class="contact-card">

          <!-- Success state -->
          @if (submitted()) {
            <div class="success-state">
              <div class="success-icon">
                <i class="pi pi-check"></i>
              </div>
              <p class="success-title">
                {{ isAr() ? 'تم الإرسال بنجاح!' : 'Message Sent!' }}
              </p>
              <p class="success-text">
                {{
                  isAr()
                    ? 'شكراً لتواصلك معنا. سنرد عليك في أقرب وقت ممكن.'
                    : "Thank you for reaching out. We'll respond to your message shortly."
                }}
              </p>
              <p-button
                [label]="isAr() ? 'إرسال رسالة أخرى' : 'Send Another Message'"
                icon="pi pi-plus"
                [outlined]="true"
                (click)="resetForm()"
              />
            </div>
          }

          <!-- Contact form -->
          @if (!submitted()) {
            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-grid">

                <!-- Full Name -->
                <div class="form-field">
                  <label class="form-label" for="fullName">
                    {{ isAr() ? 'الاسم الكامل' : 'Full Name' }}
                    <span class="required-star">*</span>
                  </label>
                  <input
                    id="fullName"
                    pInputText
                    class="form-input"
                    formControlName="fullName"
                    [placeholder]="isAr() ? 'أدخل اسمك الكامل' : 'Enter your full name'"
                    autocomplete="name"
                    [attr.dir]="isAr() ? 'rtl' : 'ltr'"
                  />
                  @if (isInvalid('fullName')) {
                    <span class="field-error">
                      {{ isAr() ? 'الاسم الكامل مطلوب.' : 'Full name is required.' }}
                    </span>
                  }
                </div>

                <!-- Phone Number -->
                <div class="form-field">
                  <label class="form-label" for="phoneNumber">
                    {{ isAr() ? 'رقم الهاتف' : 'Phone Number' }}
                    <span class="required-star">*</span>
                  </label>
                  <input
                    id="phoneNumber"
                    pInputText
                    class="form-input"
                    formControlName="phoneNumber"
                    type="tel"
                    [placeholder]="isAr() ? 'أدخل رقم هاتفك' : 'Enter your phone number'"
                    autocomplete="tel"
                    dir="ltr"
                  />
                  @if (isInvalid('phoneNumber')) {
                    <span class="field-error">
                      {{ isAr() ? 'رقم الهاتف مطلوب.' : 'Phone number is required.' }}
                    </span>
                  }
                </div>

                <!-- Email (optional) -->
                <div class="form-field full-width">
                  <label class="form-label" for="email">
                    {{ isAr() ? 'البريد الإلكتروني' : 'Email Address' }}
                    <span style="color:#64748b; font-weight:400; font-size:0.8125rem; margin-inline-start:4px;">
                      ({{ isAr() ? 'اختياري' : 'optional' }})
                    </span>
                  </label>
                  <input
                    id="email"
                    pInputText
                    class="form-input"
                    formControlName="email"
                    type="email"
                    [placeholder]="isAr() ? 'أدخل بريدك الإلكتروني' : 'Enter your email address'"
                    autocomplete="email"
                    dir="ltr"
                  />
                  @if (isInvalid('email')) {
                    <span class="field-error">
                      {{ isAr() ? 'صيغة البريد الإلكتروني غير صحيحة.' : 'Please enter a valid email address.' }}
                    </span>
                  }
                </div>

                <!-- Subject -->
                <div class="form-field full-width">
                  <label class="form-label" for="subject">
                    {{ isAr() ? 'الموضوع' : 'Subject' }}
                    <span class="required-star">*</span>
                  </label>
                  <input
                    id="subject"
                    pInputText
                    class="form-input"
                    formControlName="subject"
                    [placeholder]="isAr() ? 'موضوع رسالتك' : 'Message subject'"
                    [attr.dir]="isAr() ? 'rtl' : 'ltr'"
                  />
                  @if (isInvalid('subject')) {
                    <span class="field-error">
                      {{ isAr() ? 'الموضوع مطلوب.' : 'Subject is required.' }}
                    </span>
                  }
                </div>

                <!-- Message -->
                <div class="form-field full-width">
                  <label class="form-label" for="message">
                    {{ isAr() ? 'الرسالة' : 'Message' }}
                    <span class="required-star">*</span>
                  </label>
                  <textarea
                    id="message"
                    pTextarea
                    class="form-input"
                    formControlName="message"
                    [placeholder]="isAr() ? 'اكتب رسالتك هنا...' : 'Write your message here...'"
                    [rows]="5"
                    [autoResize]="true"
                    [attr.dir]="isAr() ? 'rtl' : 'ltr'"
                  ></textarea>
                  @if (isInvalid('message')) {
                    <span class="field-error">
                      {{ isAr() ? 'الرسالة مطلوبة.' : 'Message is required.' }}
                    </span>
                  }
                </div>

              </div>

              <!-- Server error -->
              @if (serverError()) {
                <div style="margin-top: 1.25rem;">
                <p-message severity="error">
                  {{ serverError() }}
                </p-message>
                </div>
              }

              <!-- Submit -->
              <div class="form-actions">
                <p-button
                  class="submit-btn"
                  type="submit"
                  [label]="isAr() ? 'إرسال الرسالة' : 'Send Message'"
                  icon="pi pi-send"
                  [loading]="sending()"
                  [disabled]="sending()"
                  styleClass="w-full"
                />
              </div>
            </form>
          }

        </div>
      </div>
    </div>
  `
})
export class ContactPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private contactService = inject(ContactService);
  private langService = inject(LanguageService);
  private title = inject(Title);
  private meta = inject(Meta);

  readonly isAr = () => this.langService.currentLang() === 'ar';

  readonly sending = signal(false);
  readonly submitted = signal(false);
  readonly serverError = signal<string | null>(null);

  readonly form = this.fb.group({
    fullName:    ['', [Validators.required]],
    phoneNumber: ['', [Validators.required]],
    email:       ['', [Validators.email]],
    subject:     ['', [Validators.required]],
    message:     ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.title.setTitle(
      this.isAr() ? 'تواصل معنا | بيو إن إل' : 'Contact Us | BioNL'
    );
    this.meta.updateTag({
      name: 'description',
      content: this.isAr()
        ? 'تواصل مع فريق بيو إن إل الصيدلانية. نحن هنا للإجابة على استفساراتك.'
        : 'Get in touch with the BioNL Pharmaceuticals team. We are here to answer your inquiries.',
    });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  isInvalid(field: string): boolean {
    const ctrl: AbstractControl | null = this.form.get(field);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.serverError.set(null);
    this.sending.set(true);

    const { fullName, phoneNumber, email, subject, message } = this.form.getRawValue();

    const payload: { fullName: string; phoneNumber: string; subject: string; message: string; email?: string } = {
      fullName: fullName!,
      phoneNumber: phoneNumber!,
      subject: subject!,
      message: message!,
    };
    if (email) {
      payload.email = email;
    }

    this.contactService.sendMessage(payload).subscribe({
      next: () => {
        this.sending.set(false);
        this.submitted.set(true);
      },
      error: err => {
        this.sending.set(false);
        const msg = err?.error?.message;
        this.serverError.set(
          msg
            ? (this.isAr() ? `خطأ: ${msg}` : msg)
            : (this.isAr() ? 'حدث خطأ أثناء الإرسال. يرجى المحاولة مرة أخرى.' : 'An error occurred while sending. Please try again.')
        );
      }
    });
  }

  resetForm(): void {
    this.form.reset();
    this.submitted.set(false);
    this.serverError.set(null);
  }
}
