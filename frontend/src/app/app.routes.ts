import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./layouts/public-layout/public-layout.component').then(
        (m) => m.PublicLayoutComponent,
      ),
    children: [
      {
        path: 'not-found',
        loadComponent: () => import('./features/brand/brand-pages.component').then(m => m.BrandPagesComponent),
        data: { page: 'missing' },
      },
      {
        path: '',
        loadComponent: () =>
          import('./features/brand/brand-pages.component').then((m) => m.BrandPagesComponent),
        data: { page: 'home' },
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/brand/brand-pages.component').then((m) => m.BrandPagesComponent),
        data: { page: 'products' },
      },
      {
        path: 'products/:slug',
        loadComponent: () =>
          import('./features/products/pages/product-detail-page/product-detail-page.component').then(
            (m) => m.ProductDetailPageComponent,
          ),
      },
      {
        path: 'about',
        loadComponent: () =>
          import('./features/brand/brand-pages.component').then((m) => m.BrandPagesComponent),
        data: { page: 'about' },
      },
      {
        path: 'offers',
        loadComponent: () =>
          import('./features/brand/brand-pages.component').then((m) => m.BrandPagesComponent),
        data: { page: 'offers' },
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/contact/pages/contact-page/contact-page.component').then(
            (m) => m.ContactPageComponent,
          ),
      },
      {
        path: 'orders/checkout',
        loadComponent: () =>
          import('./features/orders/pages/order-form-page/order-form-page.component').then(
            (m) => m.OrderFormPageComponent,
          ),
      },
      {
        path: 'orders/success',
        loadComponent: () =>
          import('./features/orders/pages/order-success-page/order-success-page.component').then(
            (m) => m.OrderSuccessPageComponent,
          ),
      },
    ],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import('./layouts/admin-layout/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login-page/login-page.component').then(
            (m) => m.LoginPageComponent,
          ),
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/brand/dashboard.component').then((m) => m.DashboardComponent),
        canActivate: [adminAuthGuard],
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/admin/categories/pages/admin-categories-list/admin-categories-list.component').then(
            (m) => m.AdminCategoriesListComponent,
          ),
        canActivate: [adminAuthGuard],
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/admin/products/pages/admin-products-list/admin-products-list.component').then(
            (m) => m.AdminProductsListComponent,
          ),
        canActivate: [adminAuthGuard],
      },
      {
        path: 'products/create',
        loadComponent: () =>
          import('./features/admin/products/pages/admin-product-form/admin-product-form.component').then(
            (m) => m.AdminProductFormComponent,
          ),
        canActivate: [adminAuthGuard],
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./features/admin/products/pages/admin-product-form/admin-product-form.component').then(
            (m) => m.AdminProductFormComponent,
          ),
        canActivate: [adminAuthGuard],
      },
      {
        path: 'offers',
        loadComponent: () =>
          import('./features/admin/offers/pages/admin-offers-list/admin-offers-list.component').then(
            (m) => m.AdminOffersListComponent,
          ),
        canActivate: [adminAuthGuard],
      },
      {
        path: 'offers/new',
        loadComponent: () =>
          import('./features/admin/offers/pages/admin-offer-form/admin-offer-form.component').then(
            (m) => m.AdminOfferFormComponent,
          ),
        canActivate: [adminAuthGuard],
      },
      {
        path: 'offers/edit/:id',
        loadComponent: () =>
          import('./features/admin/offers/pages/admin-offer-form/admin-offer-form.component').then(
            (m) => m.AdminOfferFormComponent,
          ),
        canActivate: [adminAuthGuard],
      },
      {
        path: 'contact',
        loadComponent: () =>
          import('./features/admin/contact/pages/admin-contact-list/admin-contact-list.component').then(
            (m) => m.AdminContactListComponent,
          ),
        canActivate: [adminAuthGuard],
      },
      {
        path: 'contact/:id',
        loadComponent: () =>
          import('./features/admin/contact/pages/admin-contact-detail/admin-contact-detail.component').then(
            (m) => m.AdminContactDetailComponent,
          ),
        canActivate: [adminAuthGuard],
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/admin/orders/pages/admin-orders-list/admin-orders-list.component').then(
            (m) => m.AdminOrdersListComponent,
          ),
        canActivate: [adminAuthGuard],
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/admin/orders/pages/admin-order-detail/admin-order-detail.component').then(
            (m) => m.AdminOrderDetailComponent,
          ),
        canActivate: [adminAuthGuard],
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/not-found',
  },
];
