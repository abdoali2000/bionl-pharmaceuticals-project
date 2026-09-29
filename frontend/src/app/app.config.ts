import {
  ApplicationConfig, provideBrowserGlobalErrorListeners,
  APP_INITIALIZER, inject
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { AuthService } from './core/services/auth.service';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

/**
 * APP_INITIALIZER factory: calls AuthService.initializeAuth() once before
 * any route guard or component runs.  By the time navigation starts, the
 * currentAdmin signal holds the server-validated state (or null on 401).
 * This prevents the premature logout redirect on hard page reloads.
 */
function initAuth() {
  const authService = inject(AuthService);
  const platformId = inject(PLATFORM_ID);
  
  return () => {
    if (!isPlatformBrowser(platformId)) {
      return null;
    }

    // Trigger validation in the background without blocking Angular's bootstrap.
    // If the token is invalid, authService will handle logging out the user.
    authService.backgroundValidate();
    
    // Resolve immediately to unblock the router
    return Promise.resolve(true);
  };
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
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
