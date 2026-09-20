import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopBannerComponent } from '../../shared/components/top-banner/top-banner.component';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [RouterOutlet, TopBannerComponent],
  template: `
    <app-top-banner />
    <header>Public Header</header>
    <main>
      <router-outlet></router-outlet>
    </main>
    <footer>Public Footer</footer>
  `
})
export class PublicLayoutComponent {}
