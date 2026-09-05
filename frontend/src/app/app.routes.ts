import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { DummyComponent } from './shared/components/dummy.component';
import { LoginPageComponent } from './features/auth/login-page/login-page.component';
import { adminAuthGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
  // ─── Public routes ─────────────────────────────────────────────────────────
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: DummyComponent },
      { path: 'products', component: DummyComponent },
      { path: 'products/:slug', component: DummyComponent },
      { path: 'about', component: DummyComponent },
      { path: 'offers', component: DummyComponent },
      { path: 'contact', component: DummyComponent }
    ]
  },
  // ─── Admin routes ───────────────────────────────────────────────────────────
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      // Login is NOT guarded — it's the entry point
      { path: 'login', component: LoginPageComponent },
      // All other admin routes require a valid session
      {
        path: 'dashboard',
        component: DummyComponent,
        canActivate: [adminAuthGuard]
      }
    ]
  },
  // ─── Fallback ───────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];

