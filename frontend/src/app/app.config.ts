import {
  ApplicationConfig, provideBrowserGlobalErrorListeners,
  APP_INITIALIZER, inject
} from '@angular/core';
import { provideRouter, Router, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { AuthService } from './core/services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';
import { catchError, firstValueFrom, of, throwError } from 'rxjs';

/**
 * APP_INITIALIZER factory: restores the server-validated, HttpOnly-cookie
 * session before route guards run. No local profile is treated as proof of auth.
 */
function initAuth() {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  
  return () => {
    if (!isPlatformBrowser(platformId)) {
      return null;
    }

    return firstValueFrom(authService.restoreSession().pipe(catchError(() => of(false))));
  };
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError(error => {
      const onProtectedAdminRoute =
        router.url.startsWith('/admin/') && router.url !== '/admin/login';
      const isLoginOrLogoutRequest =
        req.url.endsWith('/auth/login') || req.url.endsWith('/auth/logout');

      if (error?.status === 401 && onProtectedAdminRoute && !isLoginOrLogoutRequest) {
        authService.clearSession();
        void router.navigate(['/admin/login'], {
          queryParams: { returnUrl: router.url },
          replaceUrl: true,
        });
      }

      return throwError(() => error);
    }),
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withInMemoryScrolling({scrollPositionRestoration:'enabled',anchorScrolling:'enabled'})),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: Aura,
        options: { darkModeSelector: '.dark-mode', cssLayer: false }
      }
    }),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuth,
      multi: true,
    }
  ]
};
