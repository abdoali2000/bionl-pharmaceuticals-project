import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header>Admin Header</header>
    <main>
      <router-outlet></router-outlet>
    </main>
  `
})
export class AdminLayoutComponent {}
