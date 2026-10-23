# Bio NL — Website Design Handoff

Date: 2026-10-23
Branch: `codex/full-website-design`
Base: the local `codex/fix-product-browsing` checkout, retaining completed G01 changes. The pre-existing route-file whitespace edit was preserved while restructuring routes.

## Requested direction

The user explicitly requested implementation of the complete website on a new branch, ahead of the previous group order: white and purple light mode, supplied company logo, subtle animation, a continuously looping offers strip, mobile-first behavior, and seven sample products. This request replaces the earlier requirement to compare three design concepts before implementing this direction. It does not imply final visual acceptance or production deployment.

## Implemented

- Shared white, lilac, plum and purple identity; Arabic and English typography, focus states, reduced-motion support and responsive spacing.
- Supplied transparent company logo copied unchanged into the public brand directory.
- Responsive header, mobile menu, language switching, cart access, footer and skip link.
- A continuous, duplicated offers marquee with a physical left-to-right track origin and language-aware text. No hover pause or timer restart; reduced-motion preferences disable animation.
- Home: editorial hero, locally generated sample packaging, collection, company introduction, offers teaser and contact call to action.
- Product catalog: directly browsable collection without search/category/price controls, following the small-catalog decision.
- Product detail: existing gallery, related cards and cart behavior, restyled with the shared identity; corrected string-valued language checks.
- About: introduction, logo panel, values and honest placeholder note for unapproved company history/team content.
- Offers: bilingual cards driven by the public offers service, including an empty state.
- Contact: light responsive form retaining actual API submission and error handling. No simulated delivery/success.
- Cart, checkout and confirmation: light presentation; sample orders blocked visibly in the form and independently at the API-service boundary. Confirmation route is SSR-safe and does not claim an order was placed when no order reference is present.
- Administration: light shell and existing CRUD screens, branded login and a dashboard overview using existing endpoints. Private data is not mocked or made publicly accessible.
- A branded missing-page experience. Correct server HTTP 404 status remains a release/SEO verification item.
- Lazy component routes: substantially reduced initial bundle without increasing configured build budgets.

## Preview data and switching to live content

`frontend/src/app/features/brand/catalog-preview.ts` exports `CATALOG_PREVIEW = true` for this design branch. This is an intentional preview configuration, not a production default recommendation.

- It intercepts public product/offer reads only. There are seven sample names, prices and SVG packaging illustrations; the site identifies them as preview data.
- It does not seed or modify PostgreSQL, Cloudinary, contact messages, or existing products.
- Shared category and private admin endpoints continue to use the real API.
- Sample IDs begin with `demo-`. Requests containing those IDs cannot create orders, even after preview mode is disabled. Clear the sample cart before using real products.
- Set `CATALOG_PREVIEW` to `false` and rebuild to use real public data; the header preview label disappears. Configure the API endpoint for the deployment environment before release.
- Replace sample packaging with approved product photographs and actual bilingual information in the admin catalog.
- Sample illustrations are code-native SVG assets, reproducible with `node scripts/generate-preview-assets.mjs` from `frontend/`. They are illustrative packaging, not actual product photographs.

## Verification

- Full frontend suite passed: 19 tests across five files (`npm.cmd test -- --watch=false`). Includes existing G01 regressions plus preview isolation, blocked sample orders and real contact-request behavior.
- Production build passed under the existing 1 MB error budget after route splitting. Initial size approximately 606 kB, compared with approximately 1.69 MB in the first design build. The 500 kB warning threshold remains exceeded; checkout component CSS retains its existing size warning.
- Application TypeScript check passed without emitting files.
- Browser checks at 375px covered home, seven-product catalog, image loading, mobile menu, product details, cart, checkout, contact, About, offers and confirmation. Checked pages had no horizontal document overflow.
- Verified English/LTR switching and Arabic/RTL rendering. The mobile cart showed the selected sample product; checkout displayed the preview notice and a disabled submission button.
- Desktop home visually inspected. Public contact submission was not sent; no real orders or notification messages were created.
- Authenticated CRUD flows were not exercised with real credentials. Dashboard data requires a running API and a valid admin session. Remaining G02 authentication hardening and media/data fixes from the completion backlog are not declared complete by this visual work.

## Before release

Confirm final visual direction and official company content, replace sample data, turn preview off, configure the real API/hosting environment, validate authenticated administration and external integrations, verify production data freshness/HTTP statuses, and finish the outstanding functional completion tasks. No unverified company certifications, team members, statistics, phone numbers or WhatsApp destinations were fabricated.

No push, merge or external publication was performed for this design branch.
