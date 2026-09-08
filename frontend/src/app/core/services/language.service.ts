import { Injectable, signal, effect, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT } from '@angular/common';

export type Language = 'ar' | 'en';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  readonly currentLang = signal<Language>('ar');

  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const stored = localStorage.getItem('app_lang') as Language;
      if (stored === 'en' || stored === 'ar') {
        this.currentLang.set(stored);
      }
    }

    effect(() => {
      const lang = this.currentLang();
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('app_lang', lang);
      }
      this.document.documentElement.lang = lang;
      this.document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    });
  }

  toggleLanguage() {
    this.currentLang.update(l => l === 'ar' ? 'en' : 'ar');
  }
}
