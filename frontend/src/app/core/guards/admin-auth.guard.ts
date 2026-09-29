import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Functional CanActivate guard that protects all /admin/* routes.
 *
 * Strategy (post auth-persistence fix):
 *  - Reads currentAdmin signal synchronously.  The signal is pre-populated
 *    from localStorage at service construction time, so it is never null on
 *    a hard reload when the user has an active session.
 *  - APP_INITIALIZER calls AuthService.initializeAuth() once at startup,
 *    which hits GET /auth/me, refreshes the signal (or clears it on 401),
 *    and completes before any navigation guard runs.  This guarantees the
 *    guard always sees the server-validated state.
 *  - Because the signal is populated before guards execute, this function
 *    is now synchronous (returns a boolean), eliminating any per-navigation
 *    network round-trip and the race-condition that caused premature logouts.
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
