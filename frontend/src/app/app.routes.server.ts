import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static public pages — can be prerendered at build time
  { path: '',          renderMode: RenderMode.Prerender },
  { path: 'about',     renderMode: RenderMode.Prerender },
  { path: 'offers',    renderMode: RenderMode.Prerender },
  { path: 'contact',   renderMode: RenderMode.Prerender },
  { path: 'products',  renderMode: RenderMode.Prerender },

  // Dynamic routes — must be SSR (slug is unknown at build time)
  { path: 'products/:slug', renderMode: RenderMode.Server },

  // Admin routes — always SSR, never prerendered (auth-gated)
  { path: 'admin',           renderMode: RenderMode.Server },
  { path: 'admin/login',     renderMode: RenderMode.Server },
  { path: 'admin/dashboard', renderMode: RenderMode.Server },

  // Wildcard fallback — SSR
  { path: '**', renderMode: RenderMode.Server }
];

