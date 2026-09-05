import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <header>Public Header</header>
    <main>
      <router-outlet></router-outlet>
    </main>
    <footer>Public Footer</footer>
  `
})
export class PublicLayoutComponent {}
