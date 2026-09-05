import { Routes } from '@angular/router';
import { PublicLayoutComponent } from './layouts/public-layout/public-layout.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { DummyComponent } from './shared/components/dummy.component';

export const routes: Routes = [
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
  {
    path: 'admin',
    component: AdminLayoutComponent,
    children: [
      { path: 'login', component: DummyComponent },
      { path: 'dashboard', component: DummyComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
