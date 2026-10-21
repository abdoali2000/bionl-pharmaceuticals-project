# Bio NL Pharmaceuticals — Completion Backlog

Created: 2026-10-21
Baseline: source review and checks recorded on 2026-10-20
Purpose: execute the remaining work in small, reviewable tasks without changing the original backlog into a progress log.

## 1. Document boundaries and working agreement

- This document is the working backlog for completion work only.
- [Original backlog](05-project-backlog.md) remains a fixed reference for original requirements and acceptance criteria (AC).
- [Audit report](06-project-audit-2026-10-20.md) records the findings behind the repair tasks. Its original language and contents are preserved.
- Referenced original AC still apply unless a scope change is explicitly agreed. A repair task does not imply rebuilding the entire original feature.
- All new task text, technical documentation, code comments, branch names, and commit messages must be in English. Arabic is used for conversation and for intended Arabic product content and interface text.
- **Do not modify any file that existed when this completion backlog was created without asking the user first.** Before each implementation group, identify the existing files to change and request approval for that scope. Approval to create this document does not authorize implementation changes.
- Approval for a defined group covers its stated changes; ask again when an additional existing file or a material scope change is needed. Do not repeatedly request approval for the same approved scope.
- Do not translate or edit the existing audit, README, requirements, or original backlog as part of creating this document.
- Branches and commit messages below are proposals. No branch, commit, or application change is created by this plan.
- Creating this plan does not automatically start its implementation. The first proposed implementation group is G01.

### Task lifecycle

Use `TODO`, `IN PROGRESS`, `DONE`, or `BLOCKED` in each task's status field. Set `DONE` only when its applicable AC pass and verification evidence is recorded. For `BLOCKED`, record the concrete dependency or missing decision.

Keep tracking lightweight: update status and add a short verification note with the actual commit SHA when available. Git retains implementation history; do not maintain a diary here. Unavailable verification must be recorded, never assumed to have passed.

### Execution cycle

1. Select the next group whose dependencies are satisfied and recheck the relevant finding against current code.
2. Explain the expected result and proposed existing-file changes; obtain the approval required above.
3. Create the group's branch from the agreed, updated base. Keep unrelated user work out of its commits.
4. Execute one task at a time. Use the suggested commit message, adjusted to the actual change; do not create empty or artificial commits.
5. Run focused checks and the group's exit checks. Record results, actual branch, and commit references here.
6. Review the group before integration. Do not start dependent work against changes that have not been integrated or explicitly selected as its base.

## 2. Baseline: evidence, not completion percentages

| Area | Baseline evidence |
|---|---|
| Original task implementation | 22 of 25 tasks have some implementation; this is not an 88% release-readiness claim |
| Missing original pages | Home, About, and admin overview route to `DummyComponent` |
| Public layout | Header and footer remain placeholders |
| Backend build | Passed on 2026-10-20 |
| Frontend production build | Failed: initial bundle 1.63 MB against a 1 MB error budget |
| Build-time data loading | Local API was unavailable; banner/category requests produced uncaught errors |
| Frontend tests | One passed; one stale scaffold-title test failed |
| External integrations | Live database, Cloudinary, and n8n behavior not verified end to end |
| Backend E2E | Existing suites use a real database and perform cleanup; no verified isolated test database was established |
| Visual quality | Source reviewed; no browser-based visual acceptance completed |

## 3. Execution groups and branch map

Work in the order below by default. Dependencies identify actual technical gates; design inventory may be discussed earlier without changing application files.

| Group | Tasks | Proposed branch | Depends on | Exit condition |
|---|---|---|---|---|
| G01 Product browsing | FIX-PRD-01 to 03 | `codex/fix-product-browsing` | None | Category, related-product, and zero-price regressions verified |
| G02 Admin authentication | FIX-AUTH-01 to 02 | `codex/fix-admin-auth` | G01 reviewed | Server throttling and browser session lifecycle verified |
| G03 Frontend build and rendering | STAB-FE-01 to 03 | `codex/stabilize-frontend-build` | G02 reviewed | Production build passes; API and rendering policies documented |
| G04 Test infrastructure | QA-BASE-01 | `codex/isolate-integration-tests` | G03 | Backend tests run only against an isolated database using production-equivalent HTTP setup |
| G05 Upload consistency | FIX-MEDIA-01 | `codex/fix-upload-consistency` | G04 | Failure paths preserve references and compensate new uploads |
| G06 Order and offer correctness | FIX-DATA-01 to 02 | `codex/fix-order-offer-validation` | G04, G05 | Exact money arithmetic and partial date updates verified |
| G07 Design direction | DESIGN-01 to 02 | `codex/design-direction` | G06 reviewed | User selects and approves one visual direction |
| G08 Shared public interface | UI-BASE-01 to 02 | `codex/public-ui-foundation` | G03, G07 | Shared components and responsive navigation accepted |
| G09 Home page | PAGE-01 | `codex/home-page` | G01, G08 | API-driven home page replaces its placeholder |
| G10 About page | PAGE-02 | `codex/about-page` | G08, approved company content | Bilingual About page replaces its placeholder |
| G11 Existing public pages | PAGE-03 to 04 | `codex/unify-public-pages` | G09, G10 | Catalog, offers, contact, cart, and checkout use the approved design |
| G12 SEO and missing routes | SEO-01 | `codex/fix-public-seo` | G11 | Metadata transitions and HTTP 404 behavior verified |
| G13 Admin completion | ADMIN-01 to 02 | `codex/complete-admin-dashboard` | G02, G06, G12 reviewed | Overview works; order layout and proof viewing accepted |
| G14 Release verification | QA-REL-01 to 02 | `codex/release-verification` | G05, G06, G12, G13 | Functional and visual release evidence recorded |
| G15 Deployment and handoff | REL-01 to 02 | `codex/release-handoff` | G14 | Deployment configuration validated and remaining decisions resolved |

Review checkpoints: G03 technical baseline; G07 direction selection; G09 first complete public page; G14 release acceptance. These are review points, not permission to publish.

## 4. Functional fixes

### FIX-PRD-01 — Align category filtering with the public API

- **Status:** DONE
- **Reference:** EP-03-01, EP-03-05; audit: product API contract mismatch.
- **Objective:** Make category selection, shared links, and reloads return the correct products.
- **Scope:** Public products query types, service parameters, list filter state, and relevant navigation links. Use `category=<slug>` consistently. Decide explicitly whether legacy `categoryId` URLs need compatibility; do not silently expand backend query support.
- **Out of scope:** Page redesign and category management changes.
- **Dependencies:** None.
- **Branch:** G01.
- **Suggested commit:** `fix(products): align category filters with the public API`
- **Acceptance criteria:**
  - [x] Selecting a category sends a supported query and displays only its products without validation errors.
  - [x] Loading or reloading `/products?category=<slug>` restores the category filter.
  - [x] Clearing the category preserves other active filters and restores the appropriate results.
  - [x] A focused regression check covers the frontend/backend query contract.
- **Verification:** Completed on 2026-10-22 on `codex/fix-product-browsing`; implementation commit `9b14d4e` (`fix(products): align category filters with the public API`). Seven focused tests passed across the service and routed product-list page using Angular's HTTP testing backend; six failed before the fix. Command from `frontend/`: `npm.cmd test -- --watch=false --include=src/app/features/products/**/*.spec.ts`. Application TypeScript check passed: `node_modules/.bin/tsc.cmd --project tsconfig.app.json --noEmit`. A separate, database-free check of the backend source DTO confirmed that `category=derma` with search/price parameters passes strict whitelist validation and `categoryId` is rejected. Canonical links use category slugs; legacy UUID links are not supported, and stale `categoryId` parameters are removed when filters change. Tests cover direct URLs, page recreation from a saved URL, filtered response rendering, and clearing category while retaining other filters. No live database/browser acceptance was performed. The previously reported full-suite scaffold failure and production bundle issue remain outside this task and were not rerun or declared resolved.

### FIX-PRD-02 — Use related products returned by product details

- **Status:** TODO
- **Reference:** EP-03-01, EP-03-06.
- **Objective:** Restore related products without unsupported `categoryId` or `limit` requests.
- **Scope:** Product-detail response types and related-products rendering; use the existing API response.
- **Out of scope:** New recommendation logic or endpoints.
- **Dependencies:** FIX-PRD-01.
- **Branch:** G01.
- **Suggested commit:** `fix(products): use related products from the detail response`
- **Acceptance criteria:**
  - [ ] Up to four related products render from the detail response, excluding the current product.
  - [ ] No redundant related-products request sends unsupported query parameters.
  - [ ] Empty related results leave a clean page state.
  - [ ] Navigating between related products refreshes the selected product and related section.
- **Verification:** Pending.

### FIX-PRD-03 — Preserve zero-valued price filters

- **Status:** TODO
- **Reference:** EP-03-01, EP-03-05.
- **Objective:** Treat zero as an entered price rather than an empty field.
- **Scope:** Price input normalization, URL state, and request construction.
- **Out of scope:** Pricing model changes.
- **Dependencies:** FIX-PRD-01.
- **Branch:** G01.
- **Suggested commit:** `fix(products): preserve zero-valued price filters`
- **Acceptance criteria:**
  - [ ] Zero remains active in price inputs, URLs, and API requests.
  - [ ] Empty input removes the filter; clearing and reloading preserve the intended state.
  - [ ] Regression coverage distinguishes zero from null and empty values.
- **Verification:** Pending.

### FIX-AUTH-01 — Enforce login request throttling

- **Status:** TODO
- **Reference:** EP-02-01.
- **Objective:** Enforce the existing ten-attempt, fifteen-minute login limit.
- **Scope:** Register the appropriate throttling guard and verify its actual route coverage. Use targeted scope unless wider throttling is explicitly agreed.
- **Out of scope:** Refresh tokens, new roles, or public authentication.
- **Dependencies:** G01 reviewed; no technical dependency on product code.
- **Branch:** G02.
- **Suggested commit:** `fix(auth): enforce login attempt throttling`
- **Acceptance criteria:**
  - [ ] The eleventh login request from the same test identity within the window receives 429.
  - [ ] Normal login still works below the limit; time-window behavior is tested without a real fifteen-minute wait.
  - [ ] Unrelated routes do not acquire an accidental new restriction.
- **Verification:** Pending.

### FIX-AUTH-02 — Validate admin sessions and handle expiration

- **Status:** TODO
- **Reference:** EP-02-01, EP-02-02.
- **Objective:** Make admin navigation depend on the server session rather than a trusted local profile.
- **Scope:** Auth initialization, route guard, protected-request 401 handling, logout, and unused local-token/Bearer paths. Retain the HttpOnly cookie contract.
- **Out of scope:** Changing authentication architecture or adding persistent raw JWT storage.
- **Dependencies:** FIX-AUTH-01.
- **Branch:** G02.
- **Suggested commit:** `fix(auth): validate admin sessions and handle expiration`
- **Acceptance criteria:**
  - [ ] A stored profile alone cannot establish an authenticated session; a valid cookie survives reload.
  - [ ] A protected API 401 clears stale UI state and redirects to login without a redirect loop, preserving a valid internal return destination.
  - [ ] Invalid login stays on the login form; public requests do not trigger admin redirects.
  - [ ] Logout and back navigation do not restore protected data from stale frontend state.
  - [ ] SSR does not expose private data or use browser-only storage; temporary network failures have an explicit, tested behavior.
- **Verification:** Pending.

## 5. Build, rendering, and data reliability

### STAB-FE-01 — Configure API endpoints and recover from noncritical failures

- **Status:** TODO
- **Reference:** EP-01-02, EP-06-02.
- **Objective:** Remove deployment dependence on a hardcoded localhost URL and stop noncritical banner errors from escaping.
- **Scope:** Environment/runtime configuration appropriate to browser and SSR requests; banner and category-loading error handling. Document the selected configuration.
- **Out of scope:** Live deployment and exposing private server configuration to browser bundles.
- **Dependencies:** G02 reviewed.
- **Branch:** G03.
- **Suggested commit:** `fix(frontend): configure API endpoints and recover from loading errors`
- **Acceptance criteria:**
  - [ ] Local and production API addresses are configurable without editing the service implementation.
  - [ ] Browser requests and SSR use an appropriate, reachable endpoint with credentials where required.
  - [ ] Banner failure hides the optional banner without an uncaught exception; category failure has a defined recovery state.
  - [ ] API-unavailable behavior is verified rather than hidden by a successful-path-only check.
- **Verification:** Pending.

### STAB-FE-02 — Define rendering and data freshness behavior

- **Status:** TODO
- **Reference:** EP-01-02, EP-03-05, EP-03-06, EP-06-02, EP-08-01.
- **Objective:** Ensure dynamic public data and server-rendered HTML follow a deliberate freshness policy.
- **Scope:** Route rendering modes, transfer behavior, build-time API dependencies, and admin rendering boundaries. Prefer request-time SSR for changing catalog/offers unless a different update mechanism is agreed and verified.
- **Out of scope:** Introducing a cache platform without a demonstrated need.
- **Dependencies:** STAB-FE-01.
- **Branch:** G03.
- **Suggested commit:** `fix(ssr): define fresh data rendering for public routes`
- **Acceptance criteria:**
  - [ ] A newly changed product or offer appears on a fresh request according to the documented policy without an unexplained stale build snapshot.
  - [ ] Server HTML contains public data when API data is available; failure behavior is explicit.
  - [ ] Static generation does not silently require an undeclared running local API.
  - [ ] Admin pages cannot share private server-rendered or cached data between requests.
- **Verification:** Pending.

### STAB-FE-03 — Restore a passing production build and meaningful baseline tests

- **Status:** TODO
- **Reference:** EP-01-02; audit: bundle budget and stale scaffold test.
- **Objective:** Establish a repeatable technical baseline before visual implementation.
- **Scope:** Route-level lazy loading, necessary import cleanup, measured stylesheet reductions, and replacing the obsolete scaffold-title assertion with a useful application check.
- **Out of scope:** Raising budgets just to conceal the reported size regression.
- **Dependencies:** STAB-FE-01, STAB-FE-02.
- **Branch:** G03.
- **Suggested commit:** `perf(frontend): split route bundles and restore build checks`
- **Acceptance criteria:**
  - [ ] Frontend production build exits successfully under the configured error budgets; remaining warnings are explained.
  - [ ] Admin feature code is loaded separately from the initial public experience where practical; direct navigation still works.
  - [ ] Existing frontend tests pass and no assertion expects the removed Angular welcome page.
  - [ ] Backend build still passes; before/after initial bundle sizes are recorded.
- **Verification:** Pending.

### QA-BASE-01 — Establish isolated, production-equivalent API integration tests

- **Status:** TODO
- **Reference:** EP-01-01 and existing product/offer suites.
- **Objective:** Make subsequent backend failure-path tests safe and representative.
- **Scope:** Dedicated test database configuration, guarded setup/cleanup, and HTTP bootstrap alignment for validation, response envelope, exceptions, cookies, and guards. Choose test doubles for Cloudinary/n8n in automated suites.
- **Out of scope:** Running cleanup against development or production data and contacting real notification recipients.
- **Dependencies:** G03.
- **Branch:** G04.
- **Suggested commit:** `test(api): isolate integration data and align HTTP bootstrap`
- **Acceptance criteria:**
  - [ ] Test execution refuses to clean data without an explicitly selected isolated test database.
  - [ ] Existing product and offer suites run successfully in isolation.
  - [ ] Tests exercise the effective production response envelope, validation, and auth configuration.
  - [ ] Test fixtures are scoped and cleaned up; external uploads and webhooks are controlled doubles.
- **Verification:** Pending.

### FIX-MEDIA-01 — Make uploads and database persistence consistent

- **Status:** TODO
- **Reference:** EP-03-02, EP-03-03, EP-03-04, EP-05-01, EP-06-01.
- **Objective:** Avoid orphaned new assets and broken stored references on partial failure.
- **Scope:** Product covers, gallery batches, offer images, payment proofs, and replacement/deletion ordering. Define compensating cleanup, log cleanup failures, and keep slow network uploads outside DB transactions where feasible.
- **Out of scope:** A new storage provider or an unsolicited cleanup job deleting existing assets.
- **Dependencies:** QA-BASE-01.
- **Branch:** G05.
- **Suggested commit:** `fix(media): compensate uploads when persistence fails`
- **Acceptance criteria:**
  - [ ] Later upload failure or DB failure attempts cleanup of every newly uploaded asset in that operation.
  - [ ] Replacement retains the valid old reference until the new reference is saved successfully.
  - [ ] Old-asset cleanup failure after a successful save is logged and does not discard the valid new reference.
  - [ ] Order DB records remain atomic; webhooks fire only after confirmed persistence.
  - [ ] Automated failure-path checks cover multi-file failure, DB failure, and cleanup failure without real CDN calls.
- **Verification:** Pending.

### FIX-DATA-01 — Calculate order totals using decimal arithmetic

- **Status:** TODO
- **Reference:** EP-05-01.
- **Objective:** Keep order subtotal and line totals consistent with database prices.
- **Scope:** Server-side money calculation using Prisma-compatible decimal operations.
- **Out of scope:** Discounts, shipping calculation, or payment gateway integration.
- **Dependencies:** QA-BASE-01, FIX-MEDIA-01.
- **Branch:** G06.
- **Suggested commit:** `fix(orders): calculate totals with decimal arithmetic`
- **Acceptance criteria:**
  - [ ] Subtotal equals the exact sum of stored line totals for fractional prices and multiple quantities.
  - [ ] Client-supplied prices cannot override database prices.
  - [ ] Focused tests cover fractional amounts and existing API serialization remains compatible.
- **Verification:** Pending.

### FIX-DATA-02 — Validate effective offer dates on partial updates

- **Status:** TODO
- **Reference:** EP-06-01, EP-06-03.
- **Objective:** Prevent invalid date intervals when only one endpoint is updated.
- **Scope:** Merge existing and incoming dates for validation; maintain existing create behavior.
- **Out of scope:** Changing offer scheduling semantics.
- **Dependencies:** QA-BASE-01.
- **Branch:** G06.
- **Suggested commit:** `fix(offers): validate date ranges on partial updates`
- **Acceptance criteria:**
  - [ ] Updating only startDate or endDate rejects an effective endDate that is not after startDate.
  - [ ] Valid one-date updates and text-only updates succeed.
  - [ ] Rejected updates preserve the previous record; focused regression tests pass.
- **Verification:** Pending.

## 6. Design direction and public website completion

### DESIGN-01 — Establish the content inventory and design brief

- **Status:** TODO
- **Reference:** EP-08-01, EP-08-02; original public-page requirements.
- **Objective:** Make the design decision with known content and constraints.
- **Scope:** New English design brief covering audience, primary actions, page hierarchy, available logo/product images, bilingual company content, contact/WhatsApp data, and missing inputs. Record current UI assets worth retaining.
- **Out of scope:** Inventing company history, certifications, medical claims, or final brand assets.
- **Dependencies:** G06 reviewed under the default execution order.
- **Branch:** G07.
- **Suggested commit:** `docs(design): define content inventory and website brief`
- **Acceptance criteria:**
  - [ ] Each required asset/content item is classified as available, missing, or awaiting user confirmation.
  - [ ] Home and About section outlines and primary user journeys are explicit.
  - [ ] Constraints cover Arabic-first layout, English, mobile, accessibility, and actual product imagery.
  - [ ] Missing inputs are presented together for a focused user response; affected tasks remain pending.
- **Verification:** Pending.

### DESIGN-02 — Compare concepts and obtain direction approval

- **Status:** TODO
- **Reference:** DESIGN-01.
- **Objective:** Select one visual direction before implementing all public pages.
- **Scope:** Three limited concepts of the same home introduction and product card; compare Arabic mobile views and representative desktop behavior. Record selected colors, typography, imagery, spacing, and component direction in a new design artifact.
- **Out of scope:** Three complete websites or adopting a final direction without the user's decision.
- **Dependencies:** DESIGN-01 and the inputs needed for an honest comparison.
- **Branch:** G07.
- **Suggested commit:** `docs(design): record approved visual direction`
- **Acceptance criteria:**
  - [ ] Concepts use comparable content and show the same core interface elements.
  - [ ] The user explicitly selects a direction; requested revisions are resolved.
  - [ ] The approved direction is recorded in a reviewable artifact with asset sources and unresolved inputs identified.
  - [ ] Downstream visual implementation stays pending until this decision is recorded.
- **Verification:** Pending user selection.

### UI-BASE-01 — Implement shared design foundations

- **Status:** TODO
- **Reference:** EP-01-02; approved DESIGN-02 artifact.
- **Objective:** Give public pages one reusable visual foundation.
- **Scope:** Design tokens, fonts, typography, spacing, buttons, inputs, cards, and loading/empty/error states; reuse existing components where appropriate.
- **Out of scope:** Introducing a second UI framework or redesigning admin pages wholesale.
- **Dependencies:** G03, DESIGN-02.
- **Branch:** G08.
- **Suggested commit:** `feat(ui): add approved design tokens and shared components`
- **Acceptance criteria:**
  - [ ] Representative components match the approved direction in Arabic and English.
  - [ ] Focus visibility, contrast, keyboard operation, and responsive sizing are checked.
  - [ ] Shared patterns replace unnecessary duplication in the touched components.
  - [ ] Production build remains within budgets.
- **Verification:** Pending.

### UI-BASE-02 — Build the public header, footer, language switch, and cart entry

- **Status:** TODO
- **Reference:** PublicLayoutComponent; EP-01-02, EP-05-03, EP-06-02.
- **Objective:** Replace placeholder navigation with a usable site shell.
- **Scope:** Responsive header/footer, active links, mobile menu, language control, banner integration, and existing cart entry. Use confirmed company contact data.
- **Out of scope:** New auth features or fabricated social/contact destinations.
- **Dependencies:** UI-BASE-01, required contact assets from DESIGN-01.
- **Branch:** G08.
- **Suggested commit:** `feat(layout): build responsive public navigation and footer`
- **Acceptance criteria:**
  - [ ] Public Header/Public Footer placeholders are gone; links reach the intended routes.
  - [ ] Mobile navigation works with touch and keyboard at 375px without overflow.
  - [ ] Language switches content and direction consistently and persists as intended.
  - [ ] Cart access/count and optional offer banner continue to work across public routes.
- **Verification:** Pending.

### PAGE-01 — Implement the API-driven home page

- **Status:** TODO
- **Reference:** EP-08-01 and its original AC.
- **Objective:** Replace the root placeholder with the first complete, approved public page.
- **Scope:** Approved hero, API-driven categories/products/active offers, company highlights, and contact/WhatsApp actions. Use the existing first-4-to-6-product approach unless editorial selection is separately agreed.
- **Out of scope:** A CMS, featured-product schema changes, or invented company statistics.
- **Dependencies:** G01, UI-BASE-02, required approved content.
- **Branch:** G09.
- **Suggested commit:** `feat(home): build the API-driven home page`
- **Acceptance criteria:**
  - [ ] Real API content renders server-side under the chosen policy; loading, error, and empty states work.
  - [ ] Category links use the supported slug filter; inactive/absent offers are not promoted.
  - [ ] Contact and WhatsApp actions use confirmed destinations.
  - [ ] User review accepts the Arabic mobile and desktop implementation before the direction is propagated to remaining pages.
- **Verification:** Pending.

### PAGE-02 — Implement the bilingual About page

- **Status:** TODO
- **Reference:** EP-08-02 and original company story/timeline/team requirements.
- **Objective:** Replace the About placeholder with approved company content.
- **Scope:** Approved story, mission, vision, timeline, and team sections where content is available; metadata and responsive layout.
- **Out of scope:** CMS integration and unverified corporate claims.
- **Dependencies:** UI-BASE-02, approved company text and assets. Do not silently omit required sections when inputs are missing.
- **Branch:** G10.
- **Suggested commit:** `feat(about): add approved bilingual company content`
- **Acceptance criteria:**
  - [ ] Required sections contain approved content in both languages; unresolved content is explicitly resolved with the user.
  - [ ] Server HTML and metadata represent the company page.
  - [ ] Layout matches the approved direction on mobile and desktop.
- **Verification:** Pending.

### PAGE-03 — Apply the approved design to catalog, details, offers, and contact

- **Status:** TODO
- **Reference:** EP-03-05, EP-03-06, EP-06-02, EP-07-02 and their original AC.
- **Objective:** Make the existing public pages visually consistent while preserving functionality.
- **Scope:** Cards, filters, product gallery/content, offer cards, contact form, and shared feedback states. Deliver page-specific commits if the change is large.
- **Out of scope:** Rebuilding working APIs or changing business rules for visual convenience.
- **Dependencies:** PAGE-01 accepted, PAGE-02, UI-BASE-01.
- **Branch:** G11.
- **Suggested commit:** `feat(public): apply the approved design to existing pages`
- **Acceptance criteria:**
  - [ ] All four page areas use the approved shared patterns with no obvious legacy design conflict.
  - [ ] Filtering, related products, gallery navigation, offers, contact validation, and retries retain expected behavior.
  - [ ] Arabic/English and 375px/desktop checks cover populated, empty, loading, and error states.
- **Verification:** Pending.

### PAGE-04 — Apply the approved design to cart, checkout, and order success

- **Status:** TODO
- **Reference:** EP-05-03 and its original AC.
- **Objective:** Complete a coherent ordering experience.
- **Scope:** Cart drawer, quantity controls, customer form, proof selection, validation, submit/loading/retry behavior, and success page.
- **Out of scope:** New payment providers, discounts, or a change to payment-proof requirements.
- **Dependencies:** PAGE-03, FIX-DATA-01, FIX-MEDIA-01.
- **Branch:** G11.
- **Suggested commit:** `feat(checkout): align the ordering flow with the approved design`
- **Acceptance criteria:**
  - [ ] Empty cart and invalid/oversized proof prevent invalid submission with useful bilingual feedback.
  - [ ] Quantity, totals, and cart persistence work; successful submission clears the cart and displays the order reference.
  - [ ] Recoverable failures retain entered customer information and provide a retry path.
  - [ ] Mobile keyboard, form labels, focus, and submission state are checked in both languages.
- **Verification:** Pending.

### SEO-01 — Correct metadata transitions and missing-page responses

- **Status:** TODO
- **Reference:** EP-03-06, EP-08-01, EP-08-02; audit SEO findings.
- **Objective:** Keep page metadata and route status consistent with rendered content.
- **Scope:** Public titles/descriptions, product Open Graph data, language changes, valid-product recovery after a missing product, and a real missing-route page.
- **Out of scope:** Broader multilingual URL architecture or new marketing content without agreement.
- **Dependencies:** G11.
- **Branch:** G12.
- **Suggested commit:** `fix(seo): synchronize metadata and return proper not-found responses`
- **Acceptance criteria:**
  - [ ] Metadata updates after product and language changes; a valid product does not retain stale noindex from a prior missing product.
  - [ ] Unknown routes and products show a clear not-found experience with HTTP 404 on server requests.
  - [ ] Valid public routes return appropriate status and non-placeholder titles in server HTML.
- **Verification:** Pending.

## 7. Admin completion

### ADMIN-01 — Implement the admin overview

- **Status:** TODO
- **Reference:** EP-08-03 and its original AC.
- **Objective:** Replace the dashboard placeholder with useful summary data.
- **Scope:** Product/category/order counts, unread contact count, quick links, loading/error states, and refresh on each dashboard visit using existing APIs.
- **Out of scope:** Charts, analytics, export, and new aggregate endpoints unless existing APIs prove insufficient and scope is agreed.
- **Dependencies:** FIX-AUTH-02; G12 reviewed in the default sequence.
- **Branch:** G13.
- **Suggested commit:** `feat(admin): add dashboard statistics and quick links`
- **Acceptance criteria:**
  - [ ] All four counts match API results and refresh on return to the dashboard.
  - [ ] Quick links navigate correctly; partial API failures are handled visibly.
  - [ ] Unauthorized access follows the verified session behavior.
- **Verification:** Pending.

### ADMIN-02 — Fix admin order styling and PDF proof handling

- **Status:** TODO
- **Reference:** EP-05-04; audit: missing utility styles and PDF displayed as an image.
- **Objective:** Make admin orders readable and all supported proof types usable.
- **Scope:** Resolve undefined utility styles using the established styling approach; image lightbox and PDF-specific open/preview behavior, long content, and responsive tables. Confirm how file type is identified before changing the data contract.
- **Out of scope:** Adding Tailwind solely to satisfy stray classes, or changing schema without explicit approval.
- **Dependencies:** ADMIN-01, FIX-MEDIA-01.
- **Branch:** G13.
- **Suggested commit:** `fix(admin): correct order layout and PDF proof viewing`
- **Acceptance criteria:**
  - [ ] Images open correctly; PDF proofs have an appropriate labeled action or preview instead of a broken image.
  - [ ] Multiple proofs, long names/addresses, and narrow screens remain usable.
  - [ ] Required layout and color styles actually exist and are visually verified.
- **Verification:** Pending.

## 8. Release verification and handoff

### QA-REL-01 — Verify complete business journeys

- **Status:** TODO
- **Reference:** Original functional AC for authentication, catalog, offers, orders, and contact.
- **Objective:** Establish evidence that integrated features work together.
- **Scope:** Isolated test data and meaningful automated/manual checks for admin login, category/product/images, offers, public browsing/filtering, checkout/proofs, admin order review, contact submission/read count, logout, and expiration.
- **Out of scope:** Destructive tests against live customer data or real webhook messages without user authorization.
- **Dependencies:** G05, G06, G12, G13, QA-BASE-01.
- **Branch:** G14.
- **Suggested commit:** `test: verify catalog ordering and admin journeys`
- **Acceptance criteria:**
  - [ ] The complete catalog-to-order journey passes with image and PDF proofs tested across supported paths.
  - [ ] Contact unread/read behavior, active-offer boundaries, and authenticated/unauthenticated access are verified.
  - [ ] External failure paths do not produce false success or inconsistent database state.
  - [ ] Both builds and relevant automated suites pass; command outcomes and remaining limitations are recorded in a new English verification report.
- **Verification:** Pending.

### QA-REL-02 — Verify visual quality, accessibility, RTL, and SSR

- **Status:** TODO
- **Reference:** Original mobile-first, bilingual, and SSR requirements.
- **Objective:** Accept the implemented experience in an actual browser and server responses.
- **Scope:** Representative public/admin routes at 375px and desktop, Arabic/English, keyboard navigation, validation/loading/error states, browser console, and server HTML/status checks. Recheck initial language and hydration behavior.
- **Out of scope:** Claiming a comprehensive accessibility certification from a limited review.
- **Dependencies:** QA-REL-01.
- **Branch:** G14.
- **Suggested commit:** `test(ui): document responsive RTL and SSR acceptance`
- **Acceptance criteria:**
  - [ ] No blocking overflow, inaccessible controls, broken images, or unusable navigation remains in checked views.
  - [ ] Language, direction, quantities, and mixed Arabic/English content remain coherent after reload and navigation.
  - [ ] SSR data, titles, status codes, and browser hydration behave as intended without unexplained console errors.
  - [ ] Screenshots/check results and any explicitly accepted limitations are recorded; the user reviews the final public experience.
- **Verification:** Pending.

### REL-01 — Prepare and validate deployment configuration

- **Status:** TODO
- **Reference:** EP-01-01, EP-01-02 and integration requirements.
- **Objective:** Make deployment reproducible with correct environment and integration boundaries.
- **Scope:** Document target hosting, API/browser origins, HTTPS cookie behavior, CORS, database migrations, secrets, build/start commands, and rollback steps. Add an appropriate CI check only after repository workflow changes are approved. Docker is optional.
- **Out of scope:** Publishing, production migrations, sending real notifications, buying services, or changing a live environment without explicit authorization.
- **Dependencies:** G14 and user selection of the deployment target.
- **Branch:** G15.
- **Suggested commit:** `chore(deploy): prepare production configuration and checks`
- **Acceptance criteria:**
  - [ ] A new English deployment guide describes required variables and commands without secret values.
  - [ ] A chosen nonproduction environment validates API reachability, credentialed auth, and safe startup/migration behavior.
  - [ ] Cloudinary upload/delete and n8n integration are verified using approved test resources/destinations; unverified items remain explicit release blockers.
  - [ ] Build checks and rollback procedure are documented; actual publication remains a separate user-authorized action.
- **Verification:** Pending.

### REL-02 — Resolve documentation discrepancies and record release readiness

- **Status:** TODO
- **Reference:** Audit: outdated README, single/multiple category discrepancy, model-count wording, tracked cookie file, and original AC coverage.
- **Objective:** Leave a clear handoff while preserving the user's reference documents unless edits are approved.
- **Scope:** Create a new English handoff with original-task coverage, final checks, known limitations, and decisions. Separately propose exact old-file changes: README status, requirement inconsistency, model-count wording, optional audit translation, and handling of cookie.txt. Do not expose its contents or remove it automatically.
- **Out of scope:** Rewriting the original backlog into a history log, marking unchecked original AC as passed, or modifying/removing existing files without approval.
- **Dependencies:** REL-01, G14 verification evidence.
- **Branch:** G15.
- **Suggested commit:** `docs: record completion status and release handoff`
- **Acceptance criteria:**
  - [ ] New handoff links every completion task to verification or a named unresolved blocker.
  - [ ] Original requirements are reconciled through explicit decisions; deferred scope is agreed rather than silently dropped.
  - [ ] Any edits to old files have separate, recorded user approval; declined edits are noted in the new handoff.
  - [ ] No completion percentage or release-ready statement substitutes for outstanding checks or approvals.
- **Verification:** Pending.

## 9. Next implementation checkpoint

**G01 / FIX-PRD-01 is complete** in commit `9b14d4e`. G01 remains open: **FIX-PRD-02** (related products) and **FIX-PRD-03** (zero-valued price filters) are still TODO. Continue on the same group branch, `codex/fix-product-browsing`, with a separate implementation commit for each task.

The proposed next action is **FIX-PRD-02**. Before changing its implementation, inspect the product service, product-detail page, response contract, and relevant tests; present the exact existing-file change list and obtain user approval for that scope. The approval recorded for FIX-PRD-01 does not extend to these additional changes.

Design selection and final publication are explicit user decisions. Other implementation groups also require the existing-file approval described in Section 1 until the user changes that instruction.
