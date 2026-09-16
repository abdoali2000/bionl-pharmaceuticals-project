import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Functional CanActivate guard that protects all /admin/* routes.
 *
 * Strategy:
 *  - Calls GET /auth/me on every navigation to the admin section.
 *  - If the server returns 200, the guard allows navigation.
 *  - If the server returns 401 (or any error), the guard redirects to /admin/login
 *    and blocks navigation. The attempted URL is passed as `returnUrl` so login
 *    can redirect back after a successful authentication.
 *
 * Using replaceUrl prevents the back button from restoring cached admin pages
 * after logout (satisfies the edge-case requirement in EP-02-02).
 */
export const adminAuthGuard: CanActivateFn = (
  _route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.me().pipe(
    map(() => true),
    catchError(() =>
      of(router.createUrlTree(['/admin/login'], {
        queryParams: { returnUrl: state.url }
      }))
    )
  );
};
