import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional CanActivate guard that protects all /admin/* routes.
 *
 * APP_INITIALIZER restores the HttpOnly-cookie session before navigation.
 * The guard can then make a synchronous decision from server-validated state.
 */
export const adminAuthGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // During SSR (Server-Side Rendering), we cannot access localStorage.
  // If we don't bypass the guard here, the server will assume the user is 
  // logged out (because currentAdmin is null) and will redirect to /admin/login.
  // By returning true on the server, we allow it to render the HTML shell,
  // and immediately upon browser hydration, this guard runs again on the client
  // with actual localStorage access.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  if (authService.currentAdmin()) {
    return true;
  }

  // No valid session — redirect to login preserving the intended destination.
  return router.createUrlTree(['/admin/login'], {
    queryParams: { returnUrl: state.url }
  });
};
