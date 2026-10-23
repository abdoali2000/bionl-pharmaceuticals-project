import { Directive, ElementRef, DestroyRef, Input, afterNextRender, inject } from '@angular/core';

/** Reveal once on entry; SSR and reduced-motion visitors retain visible content. */
@Directive({ selector: '[appReveal]', standalone: true })
export class RevealDirective {
  @Input() appReveal: number | string = 0;
  private element = inject(ElementRef<HTMLElement>);
  private destroy = inject(DestroyRef);

  constructor() {
    afterNextRender(() => {
      if (
        !('IntersectionObserver' in window) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
        return;
      const element = this.element.nativeElement;
      element.style.setProperty('--reveal-delay', `${Number(this.appReveal) || 0}ms`);
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              element.classList.add('motion-visible');
              observer.unobserve(element);
            }
          }
        },
        { threshold: 0.08, rootMargin: '0px 0px -25px 0px' },
      );
      element.classList.add('motion-ready');
      observer.observe(element);
      this.destroy.onDestroy(() => observer.disconnect());
    });
  }
}
