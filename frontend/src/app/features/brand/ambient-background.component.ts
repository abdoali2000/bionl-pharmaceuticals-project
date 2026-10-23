import { Component } from '@angular/core';

@Component({
  selector: 'app-ambient-background',
  standalone: true,
  template: `
    <div class="ambient-scene" aria-hidden="true">
      <span class="ambient-glow glow-one"></span><span class="ambient-glow glow-two"></span
      ><span class="ambient-glow glow-three"></span>
      <div class="ambient-grid"></div>
      <svg class="molecule molecule-one" viewBox="0 0 180 180" fill="none">
        <path
          d="M30 62L83 31L137 62V122L83 153L30 122ZM83 31V0M137 62L179 37M30 122L0 140M83 153V180"
        />
        <circle cx="30" cy="62" r="7" />
        <circle cx="83" cy="31" r="9" />
        <circle cx="137" cy="62" r="6" />
        <circle cx="137" cy="122" r="10" />
        <circle cx="83" cy="153" r="6" />
        <circle cx="30" cy="122" r="8" />
      </svg>
      <svg class="molecule molecule-two" viewBox="0 0 180 180" fill="none">
        <path d="M30 62L83 31L137 62V122L83 153L30 122ZM137 62L179 37M30 122L0 140" />
        <circle cx="30" cy="62" r="7" />
        <circle cx="83" cy="31" r="9" />
        <circle cx="137" cy="122" r="10" />
        <circle cx="83" cy="153" r="6" />
      </svg>
      @for (dot of dots; track dot) {
        <span class="ambient-particle" [style.--particle-index]="dot"></span>
      }
    </div>
  `,
})
export class AmbientBackgroundComponent {
  readonly dots = [0, 1, 2, 3, 4, 5, 6, 7];
}
