import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { DummyComponent } from './shared/components/dummy.component';
import { LoginPageComponent } from './features/auth/login-page/login-page.component';
import { adminAuthGuard } from './core/guards/admin-auth.guard';
import { AdminCategoriesListComponent } from './features/admin/categories/pages/admin-categories-list/admin-categories-list.component';
import { AdminProductsListComponent } from './features/admin/products/pages/admin-products-list/admin-products-list.component';
import { AdminProductFormComponent } from './features/admin/products/pages/admin-product-form/admin-product-form.component';
import { ProductsPageComponent } from './features/products/pages/products-page/products-page.component';

export const routes: Routes = [
  // ─── Public routes ─────────────────────────────────────────────────────────
  {
    path: '',
    component: PublicLayoutComponent,
    children: [
      { path: '', component: DummyComponent },
      { path: 'products', component: ProductsPageComponent },
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
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'login', component: LoginPageComponent },
      // All other admin routes require a valid session
      {
        path: 'dashboard',
        component: DummyComponent,
        canActivate: [adminAuthGuard]
      },
      {
        path: 'categories',
        component: AdminCategoriesListComponent,
        canActivate: [adminAuthGuard]
      },
      // ─── Product Management ─────────────────────────────────────────────────
      {
        path: 'products',
        component: AdminProductsListComponent,
        canActivate: [adminAuthGuard]
      },
      {
        path: 'products/create',
        component: AdminProductFormComponent,
        canActivate: [adminAuthGuard]
      },
      {
        path: 'products/:id/edit',
        component: AdminProductFormComponent,
        canActivate: [adminAuthGuard]
      }
    ]
  },
  // ─── Fallback ───────────────────────────────────────────────────────────────
  { path: '**', redirectTo: '' }
];


