# Bio NL Pharmaceuticals — Engineering Execution Plan

**Version:** 1.0  
**Stack:** NestJS · Angular SSR · PostgreSQL · Prisma 7 · Cloudinary · JWT  
**Schema Version:** 2.0 (validated)

---

# 1. EPICS

| Code | Name | Goal | Scope | Dependencies |
|------|------|------|-------|--------------|
| **EP-01** | Project Foundation & Infrastructure | Set up the development environment, project scaffolding, and shared infrastructure for both backend and frontend | NestJS project init, Prisma setup, Cloudinary config, environment variables, shared response envelope, global error handling | None |
| **EP-02** | Authentication | Implement admin-only JWT authentication with HttpOnly cookies, login/logout/me endpoints | Auth module, JWT strategy, cookie setup, guards, rate limiting on login | EP-01 |
| **EP-03** | Product Management | Full CRUD for products including cover image, gallery images, reordering, and Cloudinary lifecycle management | Products module (admin + public), ProductImage sub-resource, slug generation, category association | EP-01, EP-04 |
| **EP-04** | Category Management | Full CRUD for categories with slug generation | Categories module (admin + public) | EP-01 |
| **EP-05** | Order System | Customer order submission with price snapshot, payment proof upload, and async n8n webhook | Orders module (public + admin), multipart form handling, Cloudinary upload, webhook service | EP-01, EP-03 |
| **EP-06** | Offers Management | Full CRUD for marketing offers with optional image and date-driven activation | Offers module (admin + public), banner endpoint | EP-01 |
| **EP-07** | Contact Messages | Public contact form submission and admin inbox with auto-read marking | Contact module (public + admin), n8n webhook | EP-01 |
| **EP-08** | Angular Frontend | Bilingual (AR/EN) SSR Angular application with all public pages and admin dashboard | All Angular pages, shared components, routing, services, admin layout | EP-02 through EP-07 |

---

# 2. TASKS

---

## EP-01: PROJECT FOUNDATION & INFRASTRUCTURE

---

### TASK-ID: EP-01-01

### Title
Initialize NestJS Backend Project

---

### Objective
Scaffold the NestJS backend with the project structure, configuration module, environment validation, and global setup required by all subsequent modules.

---

### Business Context
Every backend feature depends on a correctly configured NestJS application with Prisma, CORS, validation pipes, and the standard response envelope in place.

---

### Scope
- **Included:** NestJS project scaffold, `ConfigModule` with environment validation, `ValidationPipe` global setup, CORS restricted to `FRONTEND_URL`, standard response interceptor, global HTTP exception filter, Prisma client setup
- **Excluded:** Any feature modules, Angular setup, database migration

---

### Technical Details
1. Initialize NestJS project in `backend/` (if not already done).
2. Install core dependencies: `@nestjs/config`, `class-validator`, `class-transformer`, `@nestjs/throttler`, `cookie-parser`, `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`.
3. Create `PrismaModule` (global) with `PrismaService` wrapping `PrismaClient` from `generated/prisma`.
4. Create `ConfigModule` (global) loading `.env`; define a typed config validation schema using `joi` or `zod`.
5. Register global `ValidationPipe` with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.
6. Create `ResponseInterceptor` that wraps all successful responses in `{ success, message, data, meta }`.
7. Create `HttpExceptionFilter` that maps all thrown `HttpException`s to the same envelope with `success: false`.
8. Configure CORS: `origin: process.env.FRONTEND_URL`, `credentials: true`.
9. Enable `cookie-parser` middleware.
10. Create `backend/src/common/` directory with: `interceptors/`, `filters/`, `decorators/`, `guards/`, `utils/`.
11. Create `SlugService` utility in `common/utils/slug.util.ts` that generates slugs from English text and resolves collisions.
12. Create `CloudinaryModule` (global) initializing the Cloudinary SDK from env vars; expose a `CloudinaryService` with `uploadFile(buffer, folder)` and `deleteFile(publicId)` methods.
13. Create `WebhookService` in `common/` that fires async non-blocking POST requests to n8n URLs; errors are caught and logged, never thrown.

---

### Files to Create/Modify
- `backend/src/main.ts`
- `backend/src/app.module.ts`
- `backend/src/prisma/prisma.module.ts`
- `backend/src/prisma/prisma.service.ts`
- `backend/src/common/interceptors/response.interceptor.ts`
- `backend/src/common/filters/http-exception.filter.ts`
- `backend/src/common/utils/slug.util.ts`
- `backend/src/cloudinary/cloudinary.module.ts`
- `backend/src/cloudinary/cloudinary.service.ts`
- `backend/src/webhook/webhook.service.ts`
- `backend/.env` (already exists — add missing vars)

---

### API Endpoints (if applicable)
None — infrastructure only.

---

### Database Impact (if applicable)
- Prisma client generation via `npx prisma generate`
- First migration via `npx prisma migrate dev --name init`

---

### Acceptance Criteria
- [ ] `npm run start:dev` starts without errors
- [ ] All env vars are validated at startup; missing vars cause immediate crash with a descriptive message
- [ ] Any 404 returns `{ success: false, message: "...", data: null, meta: null }`
- [ ] Any 500 returns the same envelope without leaking stack traces
- [ ] Successful responses are wrapped in the standard envelope
- [ ] `PrismaService` connects to the database and `onModuleInit` succeeds
- [ ] `CloudinaryService.uploadFile()` and `.deleteFile()` methods exist and are tested manually

---

### Edge Cases
- Missing `DATABASE_URL` must crash the app immediately at startup, not silently at query time
- Cloudinary SDK init with missing credentials must throw a descriptive config error

---

### Dependencies
None — this is the root task.

---

### Branch Name
`feature/ep01-project-foundation`

---

### Commit Message
`feat(core): initialize nestjs project with prisma, cloudinary, and shared infrastructure`

---

### Estimated Effort
**Large**

---

### TASK-ID: EP-01-02

### Title
Initialize Angular Frontend Project

---

### Objective
Scaffold the Angular frontend with SSR, bilingual routing structure, shared interceptors, and folder organization matching the feature-based architecture.

---

### Business Context
The public website is the primary customer-facing product. It must be SSR-enabled for SEO, mobile-first, and support Arabic/English without hardcoded content.

---

### Scope
- **Included:** Angular project with SSR (`@angular/ssr`), `HttpClient` setup, global HTTP interceptor for API base URL, shared folder structure, i18n language service (not Angular i18n — a simple service holding current language), route structure skeleton
- **Excluded:** Any page implementation, component design, API calls to real endpoints

---

### Technical Details
1. Initialize Angular project with SSR in `frontend/`.
2. Create folder structure: `core/`, `shared/`, `features/`, `layouts/`.
3. Create `ApiService` in `core/` as the base HTTP service that prepends the API base URL and `withCredentials: true`.
4. Create `LanguageService` in `core/` with a signal for `currentLang: 'ar' | 'en'`, stored in `localStorage`; default is `'ar'`.
5. Create route skeleton: public routes (`/`, `/products`, `/products/:slug`, `/about`, `/offers`, `/contact`) and admin routes (`/admin/login`, `/admin/dashboard`, admin feature routes).
6. Create `PublicLayoutComponent` and `AdminLayoutComponent` in `layouts/`.
7. Add `<html dir="rtl" lang="ar">` as default in `index.html`; the `LanguageService` toggles `dir` and `lang` attributes dynamically.
8. Configure Angular SSR transfer state for API responses.

---

### Files to Create/Modify
- `frontend/src/app/app.config.ts`
- `frontend/src/app/app.routes.ts`
- `frontend/src/app/core/services/api.service.ts`
- `frontend/src/app/core/services/language.service.ts`
- `frontend/src/app/layouts/public-layout/public-layout.component.ts`
- `frontend/src/app/layouts/admin-layout/admin-layout.component.ts`
- `frontend/src/index.html`

---

### API Endpoints (if applicable)
None — frontend scaffold only.

---

### Database Impact (if applicable)
None.

---

### Acceptance Criteria
- [ ] `ng serve` and `ng build` run without errors
- [ ] SSR renders the root page server-side (verify with `curl`)
- [ ] `LanguageService` switches `document.dir` between `rtl` and `ltr`
- [ ] `ApiService` includes `withCredentials: true` on all requests
- [ ] Route guards skeleton is in place (even if not yet implemented)

---

### Edge Cases
- RTL layout must work on first load without flash; `dir="rtl"` must be in the initial server-rendered HTML

---

### Dependencies
`EP-01-01`

---

### Branch Name
`feature/ep01-angular-scaffold`

---

### Commit Message
`feat(frontend): initialize angular ssr project with bilingual routing scaffold`

---

### Estimated Effort
**Medium**

---

---

## EP-02: AUTHENTICATION

---

### TASK-ID: EP-02-01

### Title
Admin Login, Logout, and Me Endpoints

---

### Objective
Implement JWT-based authentication for admin users with HttpOnly cookie issuance, logout (cookie clearing), and profile retrieval.

---

### Business Context
The admin dashboard is the primary management tool. No admin can access any protected route without a valid JWT stored in an HttpOnly cookie. There is no public registration; admins are seeded manually.

---

### Scope
- **Included:** `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`, JWT strategy, JWT guard, cookie configuration, rate limiting on login endpoint, admin seed script
- **Excluded:** Refresh tokens, role-based access (all admins have equal permissions in V1), public user auth

---

### Technical Details
1. Create `AuthModule` with `AuthController` and `AuthService`.
2. `AuthService.login(email, password)`: find admin by email, compare password with `bcrypt.compare()`, if valid sign JWT with `{ sub: admin.id, email }`, set cookie, return admin profile (without `passwordHash`).
3. JWT secret from `JWT_SECRET` env var; expiry 24 hours.
4. Cookie spec: `httpOnly: true`, `secure: true` (production), `sameSite: 'strict'`, `path: '/'`, `maxAge: 86400000`.
5. Create `JwtStrategy` (Passport) that reads `access_token` cookie, validates the token, and attaches the admin to `request.user`.
6. Create `JwtAuthGuard` extending `AuthGuard('jwt')`.
7. Create `CurrentAdmin` decorator to extract `request.user` in controllers.
8. Apply `ThrottlerGuard` to login endpoint: max 10 requests per 15 minutes per IP.
9. Create `POST /auth/logout`: clear the `access_token` cookie (`maxAge: 0`).
10. Create `GET /auth/me`: protected by `JwtAuthGuard`, returns current admin's `id`, `email`, `fullName`, `createdAt`.
11. Create `backend/prisma/seed.ts` that creates the initial admin account using bcrypt-hashed password from env vars.

---

### Files to Create/Modify
- `backend/src/auth/auth.module.ts`
- `backend/src/auth/auth.controller.ts`
- `backend/src/auth/auth.service.ts`
- `backend/src/auth/strategies/jwt.strategy.ts`
- `backend/src/auth/guards/jwt-auth.guard.ts`
- `backend/src/auth/decorators/current-admin.decorator.ts`
- `backend/src/auth/dto/login.dto.ts`
- `backend/prisma/seed.ts`

---

### API Endpoints
**POST /auth/login**
- Request: `{ email: string, password: string }`
- Response 200: `{ success, message: "Login successful", data: { admin: { id, email, fullName } } }`
- Sets `access_token` cookie

**POST /auth/logout**
- Auth: Yes
- Response 200: `{ success, message: "Logout successful", data: null }`
- Clears `access_token` cookie

**GET /auth/me**
- Auth: Yes
- Response 200: `{ success, message: "Admin profile retrieved successfully", data: { id, email, fullName, createdAt } }`

---

### Database Impact
- **Model:** `Admin`
- **Fields read:** `id`, `email`, `passwordHash`, `fullName`, `createdAt`

---

### Acceptance Criteria
- [ ] `POST /auth/login` with valid credentials returns 200 and sets `access_token` cookie
- [ ] `POST /auth/login` with invalid credentials returns 401
- [ ] `POST /auth/login` after 10 failed attempts within 15 minutes returns 429
- [ ] All admin-protected routes return 401 when cookie is missing or expired
- [ ] `POST /auth/logout` clears the cookie
- [ ] `GET /auth/me` returns admin profile when authenticated
- [ ] `passwordHash` is never returned in any response

---

### Edge Cases
- Login with a non-existent email must return 401 (not 404, to avoid user enumeration)
- JWT expiry returns 401 with a clear message
- Cookie must use `Secure` flag only in production (`NODE_ENV === 'production'`)

---

### Dependencies
`EP-01-01`

---

### Branch Name
`feature/ep02-authentication`

---

### Commit Message
`feat(auth): implement jwt admin authentication with httponly cookies`

---

### Estimated Effort
**Medium**

---

### TASK-ID: EP-02-02

### Title
Angular Admin Authentication (Login Page + Guard)

---

### Objective
Implement the admin login page, authentication service, and route guard on the Angular frontend.

---

### Business Context
No admin dashboard page should be accessible without a valid session. The login page is the entry point for all admin operations.

---

### Scope
- **Included:** Login page component, `AuthService` (frontend), `AdminAuthGuard`, `AdminLayoutComponent` active state check, logout button
- **Excluded:** Public-facing auth UI, user registration

---

### Technical Details
1. Create `LoginPageComponent` under `features/auth/`.
2. `AuthService` (frontend): calls `POST /auth/login` with `{ email, password }`, calls `GET /auth/me` to check session status on app init.
3. `AdminAuthGuard` (`CanActivate`): calls `GET /auth/me`; if 401, redirect to `/admin/login`.
4. On logout: call `POST /auth/logout`, clear local auth state, redirect to `/admin/login`.
5. Login form: email + password fields with validation, Arabic/English labels, loading state during request.
6. Error display: show server error message below the form.
7. On successful login: redirect to `/admin/dashboard`.

---

### Files to Create/Modify
- `frontend/src/app/features/auth/login-page/login-page.component.ts`
- `frontend/src/app/core/services/auth.service.ts`
- `frontend/src/app/core/guards/admin-auth.guard.ts`

---

### API Endpoints
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`

---

### Database Impact
None (frontend).

---

### Acceptance Criteria
- [ ] Navigating to any `/admin/*` route without a session redirects to `/admin/login`
- [ ] Valid credentials redirect to `/admin/dashboard`
- [ ] Invalid credentials show an error message
- [ ] Logout clears the session and redirects to login
- [ ] Login form is usable on mobile (large tap targets, appropriate keyboard types)

---

### Edge Cases
- Session expires mid-session: the next API call returns 401, guard catches it and redirects to login
- Back button after logout must not restore the admin dashboard (no cached state)

---

### Dependencies
`EP-01-02`, `EP-02-01`

---

### Branch Name
`feature/ep02-angular-auth`

---

### Commit Message
`feat(frontend/auth): implement admin login page and session guard`

---

### Estimated Effort
**Small**

---

---

## EP-03: PRODUCT MANAGEMENT

---

### TASK-ID: EP-03-01

### Title
Backend: Public Products Endpoints

---

### Objective
Implement `GET /products` (with filters) and `GET /products/:slug` for public consumers.

---

### Business Context
Products are the core catalog. The public website displays them on the home page, products listing, and product detail pages. Filtering by category slug, search by name, and price range are required for the products page.

---

### Scope
- **Included:** `GET /products`, `GET /products/:slug`, query filters (category, search, minPrice, maxPrice), related products logic, public response shape (no `cloudinaryPublicId`)
- **Excluded:** Admin product endpoints, pagination (no pagination in V1)

---

### Technical Details
1. Create `ProductsModule` with `ProductsController` and `ProductsService`.
2. `GET /products`: accepts query params `category` (slug), `search` (partial, case-insensitive on `nameAr` and `nameEn`), `minPrice`, `maxPrice`. Build Prisma `where` clause dynamically. Include `categories` (via `ProductCategory` → `Category`) and `images` (ordered by `displayOrder`). Strip `cloudinaryPublicId` from all image and product objects before returning.
3. `GET /products/:slug`: find product by slug, 404 if not found. Also compute `relatedProducts`: find up to 4 other products sharing at least one category with the current product, return only `id`, `slug`, `nameAr`, `nameEn`, `price`, `coverImageUrl`.
4. Create `PublicProductDto` and `PublicProductImageDto` using class-transformer `@Exclude()` on sensitive fields, or manually map in the service.
5. Response meta includes `{ total: number }`.

---

### Files to Create/Modify
- `backend/src/products/products.module.ts`
- `backend/src/products/products.controller.ts`
- `backend/src/products/products.service.ts`
- `backend/src/products/dto/get-products-query.dto.ts`
- `backend/src/products/dto/public-product.dto.ts`

---

### API Endpoints
**GET /products**
- Query: `category?`, `search?`, `minPrice?`, `maxPrice?`
- Response 200: array of public product objects + `meta.total`

**GET /products/:slug**
- Response 200: single public product object with `relatedProducts`
- Response 404: product not found

---

### Database Impact
- **Models:** `Product`, `ProductImage`, `ProductCategory`, `Category`
- **Fields excluded from public response:** `coverImagePublicId`, `ProductImage.cloudinaryPublicId`

---

### Acceptance Criteria
- [ ] `GET /products` returns all products with `categories` and `images` arrays
- [ ] `?category=derma` returns only products linked to the "derma" category slug
- [ ] `?search=bio` returns products whose `nameAr` or `nameEn` contains "bio" (case-insensitive)
- [ ] `?minPrice=100&maxPrice=200` filters by price range
- [ ] `GET /products/:slug` returns 404 for unknown slugs
- [ ] `relatedProducts` contains max 4 items, excludes current product
- [ ] `cloudinaryPublicId` is absent from all public responses
- [ ] `images` are sorted by `displayOrder` ascending

---

### Edge Cases
- `?category=nonexistent` returns an empty array, not 404
- Product with no categories still appears in `GET /products` (unfiltered)
- Product with no gallery images returns `images: []`
- `?minPrice=0` should be treated as a valid filter (not ignored)

---

### Dependencies
`EP-01-01`, `EP-04-01`

---

### Branch Name
`feature/ep03-public-products`

---

### Commit Message
`feat(products): implement public product listing and detail endpoints`

---

### Estimated Effort
**Medium**

---

### TASK-ID: EP-03-02

### Title
Backend: Admin Product CRUD (Text + Categories)

---

### Objective
Implement admin endpoints for creating, updating, and deleting products (text fields and category associations). Cover image upload is handled in EP-03-03.

---

### Business Context
Admins create and maintain the product catalog. Creating a product requires both text content and a cover image. Updating text/categories must not affect the slug (SEO permanence).

---

### Scope
- **Included:** `POST /admin/products` (text fields + cover image in one request), `PATCH /admin/products/:id` (text + categories only), `DELETE /admin/products/:id` (full cascade with Cloudinary cleanup), `GET /admin/products`, `GET /admin/products/:id`
- **Excluded:** Gallery image management (EP-03-03), cover image replacement (EP-03-04)

---

### Technical Details
1. All admin product routes protected by `JwtAuthGuard`.
2. `POST /admin/products`: accepts `multipart/form-data`. Parse text fields via DTO, validate `coverImage` file (MIME: `image/jpeg`, `image/png`, `image/webp`; max 5MB). Upload cover image to Cloudinary folder `bionl/products/covers`. Generate slug from `nameEn` using `SlugService`. If `categoryIds` provided, validate each UUID exists in `Category` table. Create `Product` and `ProductCategory` records in a Prisma transaction.
3. `PATCH /admin/products/:id`: JSON body. Update only provided fields. If `categoryIds` is provided, replace all `ProductCategory` records (delete existing, create new) within a transaction. Slug is never regenerated.
4. `DELETE /admin/products/:id`: (a) Fetch all `ProductImage` records for the product; (b) Delete each gallery image from Cloudinary using `cloudinaryPublicId`; (c) Delete cover image from Cloudinary using `coverImagePublicId`; (d) Prisma cascade handles DB deletion of `ProductImage`, `ProductCategory`, and `OrderItem.productId → SET NULL`.
5. `GET /admin/products`: same filters as public, but response includes `coverImagePublicId` and `images[].cloudinaryPublicId`.
6. `GET /admin/products/:id`: by UUID (not slug), returns full admin product object.

---

### Files to Create/Modify
- `backend/src/products/products.controller.ts`
- `backend/src/products/products.service.ts`
- `backend/src/products/dto/create-product.dto.ts`
- `backend/src/products/dto/update-product.dto.ts`
- `backend/src/products/dto/admin-product.dto.ts`

---

### API Endpoints
**GET /admin/products** — Auth: Yes — Same filters as public + Cloudinary IDs in response  
**GET /admin/products/:id** — Auth: Yes — Full admin view by UUID  
**POST /admin/products** — Auth: Yes — multipart/form-data  
**PATCH /admin/products/:id** — Auth: Yes — JSON  
**DELETE /admin/products/:id** — Auth: Yes

---

### Database Impact
- **Models:** `Product`, `ProductCategory`, `ProductImage`, `OrderItem`
- **Operations:** Create, update, delete `Product`; replace `ProductCategory` records; `OrderItem.productId` → `SET NULL` via Prisma cascade

---

### Acceptance Criteria
- [ ] `POST /admin/products` creates product with slug derived from `nameEn`
- [ ] Duplicate slug appends `-2`, `-3`, etc.
- [ ] Invalid `categoryIds` returns 400
- [ ] `PATCH /admin/products/:id` with `categoryIds` fully replaces category associations
- [ ] `PATCH /admin/products/:id` with `nameEn` does NOT change the slug
- [ ] `DELETE /admin/products/:id` removes all gallery images from Cloudinary before deleting DB records
- [ ] `DELETE /admin/products/:id` removes cover image from Cloudinary
- [ ] Associated `OrderItem` records have `productId` set to `null` after product deletion
- [ ] Unauthenticated requests to all admin endpoints return 401

---

### Edge Cases
- `POST /admin/products` without `coverImage` file returns 400
- `DELETE /admin/products/:id` where one Cloudinary deletion fails: log the error, continue deleting remaining files, complete the DB deletion (do not rollback the entire operation for a CDN failure)
- `categoryIds: []` (empty array) should remove all category associations

---

### Dependencies
`EP-01-01`, `EP-02-01`, `EP-04-01`

---

### Branch Name
`feature/ep03-admin-product-crud`

---

### Commit Message
`feat(products): implement admin product crud with cloudinary integration`

---

### Estimated Effort
**Large**

---

### TASK-ID: EP-03-03

### Title
Backend: Product Gallery Image Management

---

### Objective
Implement endpoints for uploading, deleting, and reordering product gallery images.

---

### Business Context
Admins can add multiple additional images to a product beyond the cover image. Gallery order is admin-controlled via `displayOrder`.

---

### Scope
- **Included:** `POST /admin/products/:id/images` (upload up to 10 images), `DELETE /admin/products/:id/images/:imageId`, `PATCH /admin/products/:id/images/reorder`
- **Excluded:** Cover image (EP-03-04)

---

### Technical Details
1. `POST /admin/products/:id/images`: accept `images` file array (max 10, each max 5MB, MIME: jpeg/png/webp). Determine the current highest `displayOrder` for this product's gallery images. Upload each image to Cloudinary folder `bionl/products/gallery`. Create `ProductImage` records with incremental `displayOrder` starting after the current max.
2. `DELETE /admin/products/:id/images/:imageId`: verify image belongs to the product (return 400 if not). Delete from Cloudinary using `cloudinaryPublicId`. Delete `ProductImage` record.
3. `PATCH /admin/products/:id/images/reorder`: receive array of `{ id, displayOrder }`. Validate all IDs belong to this product. Use Prisma `$transaction` to update `displayOrder` for each. `displayOrder` values must be positive integers.

---

### Files to Create/Modify
- `backend/src/products/products.controller.ts`
- `backend/src/products/products.service.ts`
- `backend/src/products/dto/reorder-images.dto.ts`
- `backend/src/products/dto/reorder-image-item.dto.ts`

---

### API Endpoints
**POST /admin/products/:id/images** — multipart, files field `images`  
**DELETE /admin/products/:id/images/:imageId**  
**PATCH /admin/products/:id/images/reorder** — JSON body `{ images: [{ id, displayOrder }] }`

---

### Database Impact
- **Model:** `ProductImage`
- **Fields:** `imageUrl`, `cloudinaryPublicId`, `displayOrder`

---

### Acceptance Criteria
- [ ] Upload 3 images: each creates a `ProductImage` record with correct `displayOrder`
- [ ] Uploading 11 files returns 400
- [ ] Deleting an image not belonging to the product returns 400 (not 404)
- [ ] Reorder updates `displayOrder` for all provided IDs atomically
- [ ] Reorder with an ID not belonging to the product returns 400
- [ ] After gallery image deletion, the image is removed from Cloudinary

---

### Edge Cases
- Upload with 0 files returns 400
- `displayOrder` values in reorder do not need to be contiguous (gaps allowed)
- Cloudinary upload fails for one of multiple files: partial success is not acceptable — roll back all Cloudinary uploads that succeeded for that batch (or document the compensating action)

---

### Dependencies
`EP-03-02`

---

### Branch Name
`feature/ep03-gallery-images`

---

### Commit Message
`feat(products): implement gallery image upload, delete, and reorder`

---

### Estimated Effort
**Medium**

---

### TASK-ID: EP-03-04

### Title
Backend: Replace Product Cover Image

---

### Objective
Implement `PATCH /admin/products/:id/cover-image` to replace a product's cover image atomically.

---

### Business Context
Admins need to update a product's primary display image. The old image must be removed from Cloudinary to prevent orphaned assets accumulating on the CDN.

---

### Scope
- **Included:** Cover image replacement, old image deletion from Cloudinary, `coverImageUrl` and `coverImagePublicId` update
- **Excluded:** Gallery images

---

### Technical Details
1. Accept `multipart/form-data` with a single `coverImage` file.
2. Validate file (MIME: jpeg/png/webp, max 5MB).
3. Upload new image to Cloudinary folder `bionl/products/covers`.
4. Delete old cover image from Cloudinary using the current `coverImagePublicId` stored on the product record.
5. Update `coverImageUrl` and `coverImagePublicId` on the `Product` record.
6. Return `{ coverImageUrl, coverImagePublicId }`.

---

### Files to Create/Modify
- `backend/src/products/products.controller.ts`
- `backend/src/products/products.service.ts`

---

### API Endpoints
**PATCH /admin/products/:id/cover-image**
- Auth: Yes
- Content-Type: multipart/form-data, field: `coverImage`
- Response 200: `{ success, message, data: { coverImageUrl, coverImagePublicId } }`

---

### Database Impact
- **Model:** `Product`
- **Fields updated:** `coverImageUrl`, `coverImagePublicId`

---

### Acceptance Criteria
- [ ] Uploading a new cover image deletes the previous one from Cloudinary
- [ ] `coverImageUrl` and `coverImagePublicId` are updated in the database
- [ ] Missing or invalid file returns 400
- [ ] Product not found returns 404

---

### Edge Cases
- Cloudinary upload of the new image fails: do not delete the old image; return 500
- Cloudinary deletion of the old image fails after the new image is uploaded: log the error but keep the new image and update the DB (the new image is valid; the old one becomes an orphan that must be cleaned up manually or via a future cleanup job)

---

### Dependencies
`EP-03-02`

---

### Branch Name
`feature/ep03-cover-image-replace`

---

### Commit Message
`feat(products): implement cover image replacement with cloudinary cleanup`

---

### Estimated Effort
**Small**

---

### TASK-ID: EP-03-05

### Title
Angular: Product Listing Page

---

### Objective
Build the public-facing products listing page with search, category filter, and price range filter.

---

### Business Context
Customers browse and discover products primarily on this page. It is the highest-traffic page and must be fast, SSR-rendered, and mobile-first.

---

### Scope
- **Included:** Product grid layout, search input, category filter (chips/tabs), price range filter, product card component, empty state, loading state, SSR-compatible API call
- **Excluded:** Pagination, cart functionality, admin UI

---

### Technical Details
1. Create `ProductsService` (Angular) that calls `GET /products` with query params.
2. Create `ProductCardComponent` (shared): shows cover image, `nameAr`/`nameEn` (based on current language), price, category badges.
3. Create `ProductsPageComponent` (`/products`): filter bar at top, product grid below. Filters update URL query params and re-fetch data. On SSR, read query params from the request URL.
4. Category filter: load from `GET /categories`. Display as scrollable horizontal chip list (mobile-friendly).
5. Search: debounced input (300ms) triggers new API call.
6. Price filter: two number inputs for min/max.
7. Display `meta.total` as "X products found".

---

### Files to Create/Modify
- `frontend/src/app/features/products/products.service.ts`
- `frontend/src/app/features/products/pages/products-page/products-page.component.ts`
- `frontend/src/app/shared/components/product-card/product-card.component.ts`

---

### API Endpoints
- `GET /products`
- `GET /categories`

---

### Database Impact
None (frontend).

---

### Acceptance Criteria
- [ ] Products page renders server-side (visible in `curl` output)
- [ ] Category filter chips reflect all categories from the API
- [ ] Selecting a category filters the product list
- [ ] Search input filters products with a 300ms debounce
- [ ] Product cards display correctly in Arabic and English
- [ ] Empty state shown when no products match filters
- [ ] Page is usable on a 375px mobile viewport

---

### Edge Cases
- API returns empty array: show empty state, not a broken layout
- Network error: show a retry message

---

### Dependencies
`EP-01-02`, `EP-03-01`, `EP-04-02`

---

### Branch Name
`feature/ep03-products-page`

---

### Commit Message
`feat(frontend/products): implement products listing page with filters`

---

### Estimated Effort
**Large**

---

### TASK-ID: EP-03-06

### Title
Angular: Product Detail Page

---

### Objective
Build the SEO-optimized product detail page with bilingual content, image gallery, and related products.

---

### Business Context
The product detail page is the final decision point for customers before ordering. It must set correct meta tags for SEO and be fully renderable on the server.

---

### Scope
- **Included:** Product detail page at `/products/:slug`, image gallery component, ingredients and usage sections, related products grid, dynamic meta tags (`<title>`, `<meta name="description">`)
- **Excluded:** Add to cart (handled in order flow)

---

### Technical Details
1. Create `ProductDetailPageComponent` at route `/products/:slug`.
2. On init (server-side): call `GET /products/:slug` using the slug from route params.
3. Set `<title>` to `${product.nameEn} | Bio NL Pharmaceuticals` (switch to nameAr if language is AR).
4. Set `<meta name="description">` to the first 160 chars of the product description.
5. Create `ImageGalleryComponent` (shared): thumbnail row below main image, click thumbnail to switch main image. Include `coverImageUrl` as the first image.
6. Display all bilingual fields based on `LanguageService.currentLang`.
7. Related products: render as a horizontal scroll row on mobile.

---

### Files to Create/Modify
- `frontend/src/app/features/products/pages/product-detail-page/product-detail-page.component.ts`
- `frontend/src/app/shared/components/image-gallery/image-gallery.component.ts`

---

### API Endpoints
- `GET /products/:slug`

---

### Database Impact
None (frontend).

---

### Acceptance Criteria
- [ ] Navigating to `/products/bio-hair-oil` renders product data from the API
- [ ] `<title>` and `<meta name="description">` reflect the product content
- [ ] Language toggle switches between Arabic and English content
- [ ] Gallery shows cover image first, then gallery images in `displayOrder` order
- [ ] 404 page shown for unknown slugs
- [ ] Related products section shows up to 4 items

---

### Edge Cases
- Product with no gallery images: gallery shows only the cover image, no thumbnail row
- Slug with Arabic characters in the URL must be properly decoded

---

### Dependencies
`EP-03-05`

---

### Branch Name
`feature/ep03-product-detail`

---

### Commit Message
`feat(frontend/products): implement product detail page with seo meta tags`

---

### Estimated Effort
**Medium**

---

### TASK-ID: EP-03-07

### Title
Angular: Admin Product Management Pages

---

### Objective
Build all admin dashboard pages for creating, listing, editing, and deleting products with image management UI.

---

### Business Context
The admin dashboard is the primary tool for keeping the product catalog current. It must allow full product lifecycle management without requiring developer intervention.

---

### Scope
- **Included:** Admin product list, create product form, edit product form, gallery image upload/delete/reorder UI, cover image replace UI
- **Excluded:** Public-facing product display

---

### Technical Details
1. Admin product list page: table/card list showing product name, price, category count, cover thumbnail. Action buttons: Edit, Delete.
2. Create/Edit form: all bilingual text fields, price, category multi-select (checkboxes loaded from `GET /categories`), cover image upload preview, form validation.
3. On create: call `POST /admin/products` as multipart.
4. On edit text: call `PATCH /admin/products/:id` as JSON.
5. On edit cover: call `PATCH /admin/products/:id/cover-image` as multipart.
6. Gallery section (visible in edit mode): shows existing images with delete buttons. Drag-and-drop or up/down arrows for reordering — triggers `PATCH /admin/products/:id/images/reorder`. Upload new gallery images via `POST /admin/products/:id/images`.
7. Delete product: confirmation dialog before calling `DELETE /admin/products/:id`.

---

### Files to Create/Modify
- `frontend/src/app/features/admin/products/pages/admin-products-list/admin-products-list.component.ts`
- `frontend/src/app/features/admin/products/pages/admin-product-form/admin-product-form.component.ts`
- `frontend/src/app/features/admin/products/components/gallery-manager/gallery-manager.component.ts`

---

### API Endpoints
- `GET /admin/products`
- `POST /admin/products`
- `PATCH /admin/products/:id`
- `DELETE /admin/products/:id`
- `POST /admin/products/:id/images`
- `DELETE /admin/products/:id/images/:imageId`
- `PATCH /admin/products/:id/cover-image`
- `PATCH /admin/products/:id/images/reorder`

---

### Database Impact
None (frontend).

---

### Acceptance Criteria
- [ ] Admin can create a product with all fields, cover image, and categories
- [ ] Admin can update text fields and categories independently of images
- [ ] Admin can replace the cover image
- [ ] Admin can upload, delete, and reorder gallery images
- [ ] Delete product shows confirmation dialog, then removes the product from the list
- [ ] All forms display validation errors in the active language
- [ ] All admin routes redirect to login if not authenticated

---

### Edge Cases
- Create form submission when cover image file is missing returns a clear error message
- Reorder save with no changes should be a no-op (optionally skip the API call if order unchanged)

---

### Dependencies
`EP-02-02`, `EP-03-02`, `EP-03-03`, `EP-03-04`, `EP-04-02`

---

### Branch Name
`feature/ep03-admin-product-pages`

---

### Commit Message
`feat(frontend/admin): implement admin product management pages`

---

### Estimated Effort
**Large**

---

---

## EP-04: CATEGORY MANAGEMENT

---

### TASK-ID: EP-04-01

### Title
Backend: Category Endpoints (Public + Admin)

---

### Objective
Implement all category endpoints: public list and full admin CRUD.

---

### Business Context
Categories organize the product catalog and power the filtering system. They are created and maintained by admins and consumed by the public products page.

---

### Scope
- **Included:** `GET /categories`, `POST /admin/categories`, `PATCH /admin/categories/:id`, `DELETE /admin/categories/:id`
- **Excluded:** Category images (not in V1 schema), per-category product listing endpoint

---

### Technical Details
1. Create `CategoriesModule` with `CategoriesController` and `CategoriesService`.
2. `GET /categories`: return all categories ordered by `nameEn` ascending; include `id`, `slug`, `nameAr`, `nameEn`, `createdAt`, `updatedAt`. Meta includes `total`.
3. `POST /admin/categories`: validate `nameAr` (min 2), `nameEn` (min 2). Generate slug from `nameEn` using `SlugService`. Create category.
4. `PATCH /admin/categories/:id`: update `nameAr` and/or `nameEn`. Slug is NOT regenerated even if `nameEn` changes.
5. `DELETE /admin/categories/:id`: Prisma cascade deletes `ProductCategory` join records. Products are NOT deleted.

---

### Files to Create/Modify
- `backend/src/categories/categories.module.ts`
- `backend/src/categories/categories.controller.ts`
- `backend/src/categories/categories.service.ts`
- `backend/src/categories/dto/create-category.dto.ts`
- `backend/src/categories/dto/update-category.dto.ts`

---

### API Endpoints
**GET /categories** — Public  
**POST /admin/categories** — Auth: Yes  
**PATCH /admin/categories/:id** — Auth: Yes  
**DELETE /admin/categories/:id** — Auth: Yes

---

### Database Impact
- **Models:** `Category`, `ProductCategory`
- **Cascade:** Delete category → delete `ProductCategory` records (products unaffected)

---

### Acceptance Criteria
- [ ] `GET /categories` returns all categories ordered alphabetically by `nameEn`
- [ ] `POST /admin/categories` generates a unique slug from `nameEn`
- [ ] `PATCH /admin/categories/:id` does not change the slug when `nameEn` is updated
- [ ] `DELETE /admin/categories/:id` removes join records but not products
- [ ] Deleting a non-existent category returns 404

---

### Edge Cases
- Creating a category with a `nameEn` that would generate a duplicate slug: append `-2`, `-3` etc.
- Deleting a category with products: products remain but are unlinked from that category

---

### Dependencies
`EP-01-01`, `EP-02-01`

---

### Branch Name
`feature/ep04-categories`

---

### Commit Message
`feat(categories): implement category crud endpoints`

---

### Estimated Effort
**Small**

---

### TASK-ID: EP-04-02

### Title
Angular: Admin Category Management

---

### Objective
Build admin category list, create, edit, and delete UI.

---

### Business Context
Admins must be able to manage the category taxonomy without developer involvement.

---

### Scope
- **Included:** Admin categories list, create category modal/form, edit category modal/form, delete with confirmation
- **Excluded:** Category image management (not in V1)

---

### Technical Details
1. Admin categories list page: table with `nameAr`, `nameEn`, `slug`, created date. Actions: Edit, Delete.
2. Create/Edit form: `nameAr` and `nameEn` fields. On create, display slug preview (computed client-side from `nameEn`). On save (edit), show note that slug will not change.
3. Delete: confirmation dialog.
4. Create `CategoriesService` (Angular) calling admin category endpoints.

---

### Files to Create/Modify
- `frontend/src/app/features/admin/categories/pages/admin-categories-list/admin-categories-list.component.ts`
- `frontend/src/app/features/admin/categories/components/category-form/category-form.component.ts`
- `frontend/src/app/features/admin/categories/categories.service.ts`

---

### API Endpoints
- `GET /categories`
- `POST /admin/categories`
- `PATCH /admin/categories/:id`
- `DELETE /admin/categories/:id`

---

### Acceptance Criteria
- [ ] Admin can create, edit, and delete categories
- [ ] Slug is displayed (read-only) in the edit form
- [ ] Deleting shows a confirmation dialog
- [ ] Category list updates after create/edit/delete without full page reload

---

### Edge Cases
- Attempting to delete a category that has products shows how many products will be unlinked in the confirmation dialog

---

### Dependencies
`EP-02-02`, `EP-04-01`

---

### Branch Name
`feature/ep04-admin-categories`

---

### Commit Message
`feat(frontend/admin): implement admin category management pages`

---

### Estimated Effort
**Small**

---

---

## EP-05: ORDER SYSTEM

---

### TASK-ID: EP-05-01

### Title
Backend: Submit Order (Public)

---

### Objective
Implement `POST /orders` for customers to submit an order with items and payment proof files.

---

### Business Context
Order submission is the primary conversion action on the website. The backend must validate products, snapshot prices, upload payment proofs to Cloudinary, and trigger the n8n webhook asynchronously.

---

### Scope
- **Included:** `POST /orders`, product validation, price snapshot, payment proof upload, Cloudinary upload for proofs, n8n webhook fire, DB transaction for order creation
- **Excluded:** Order status management, admin order modification

---

### Technical Details
1. Create `OrdersModule` with `OrdersController` and `OrdersService`.
2. Accept `multipart/form-data`. Parse `items` as JSON string from form field. Validate files: min 1 `paymentProofs` file, each max 5MB, MIME: `image/jpeg`, `image/png`, `application/pdf`.
3. Validate all `productId` values exist. If any not found, return 400 with which IDs are invalid.
4. Fetch current `price`, `nameAr`, `nameEn` for each product.
5. Within a Prisma `$transaction`:
   - Create `Order` record.
   - Create `OrderItem` records with snapshots.
   - Upload each payment proof to Cloudinary folder `bionl/orders/proofs`.
   - Create `PaymentProof` records with `imageUrl` and `cloudinaryPublicId`.
6. After transaction commits, fire n8n `NEW_ORDER` webhook via `WebhookService` (async, non-blocking).
7. Return the full created order object including items and paymentProofs.

---

### Files to Create/Modify
- `backend/src/orders/orders.module.ts`
- `backend/src/orders/orders.controller.ts`
- `backend/src/orders/orders.service.ts`
- `backend/src/orders/dto/create-order.dto.ts`
- `backend/src/orders/dto/order-item-input.dto.ts`

---

### API Endpoints
**POST /orders**
- Content-Type: multipart/form-data
- Response 201: full order object

---

### Database Impact
- **Models:** `Order`, `OrderItem`, `PaymentProof`
- **Pattern:** Price snapshot — `OrderItem` stores `productNameAr`, `productNameEn`, `unitPrice` at time of order
- **Cascade:** If transaction fails, all created records are rolled back

---

### Acceptance Criteria
- [ ] Order submitted with valid items and payment proof creates all DB records
- [ ] `subtotalAmount` equals the sum of all `(unitPrice × quantity)` values
- [ ] Invalid `productId` returns 400 identifying the bad ID
- [ ] Zero payment proof files returns 400
- [ ] Payment proof file > 5MB returns 400
- [ ] n8n webhook failure does NOT cause the order request to fail
- [ ] All order, item, and proof records are created in a single transaction

---

### Edge Cases
- Cloudinary upload fails for one proof file: roll back the transaction, return 500 (the order was not placed)
- Product price changes between page load and form submission: the snapshot captures the price at submission time (this is correct behavior, not a bug)
- Duplicate product IDs in the same order: treat as separate line items or merge — document the chosen behavior (recommended: merge quantities)

---

### Dependencies
`EP-01-01`, `EP-03-01`

---

### Branch Name
`feature/ep05-submit-order`

---

### Commit Message
`feat(orders): implement order submission with payment proof upload`

---

### Estimated Effort
**Large**

---

### TASK-ID: EP-05-02

### Title
Backend: Admin Order Endpoints

---

### Objective
Implement `GET /admin/orders` (with filters) and `GET /admin/orders/:id` for the admin dashboard.

---

### Business Context
Admins need to view all incoming orders, inspect payment proofs, and filter orders by customer, date, governorate, and payment method.

---

### Scope
- **Included:** `GET /admin/orders`, `GET /admin/orders/:id`, all documented query filters
- **Excluded:** Order modification, order deletion, order status changes (V2)

---

### Technical Details
1. `GET /admin/orders`: accept query params `customerName` (partial, case-insensitive), `phoneNumber` (partial), `governorate` (exact), `paymentMethod` (enum), `dateFrom` (ISO 8601), `dateTo` (ISO 8601). Build Prisma `where` clause dynamically. Include `items` and `paymentProofs`. Order by `createdAt` DESC. Return `meta.total`.
2. `GET /admin/orders/:id`: return single order with full nested data.

---

### Files to Create/Modify
- `backend/src/orders/orders.controller.ts`
- `backend/src/orders/orders.service.ts`
- `backend/src/orders/dto/get-orders-query.dto.ts`

---

### API Endpoints
**GET /admin/orders** — Auth: Yes — With filters  
**GET /admin/orders/:id** — Auth: Yes

---

### Database Impact
- **Models:** `Order`, `OrderItem`, `PaymentProof`
- **Queries:** Filtered list with relations

---

### Acceptance Criteria
- [ ] `GET /admin/orders` returns all orders ordered newest first
- [ ] `?customerName=محمد` returns matching orders (partial, case-insensitive)
- [ ] `?governorate=القاهرة` returns exact match
- [ ] `?dateFrom=2026-01-01&dateTo=2026-01-31` filters by date range
- [ ] `?paymentMethod=INSTAPAY` returns only INSTAPAY orders
- [ ] `GET /admin/orders/:id` returns 404 for unknown UUID
- [ ] Response includes nested `items` and `paymentProofs`

---

### Edge Cases
- `dateFrom` without `dateTo`: filter from `dateFrom` to now
- `dateTo` without `dateFrom`: filter from the beginning to `dateTo`
- Filters with no results return empty array, not 404

---

### Dependencies
`EP-02-01`, `EP-05-01`

---

### Branch Name
`feature/ep05-admin-orders`

---

### Commit Message
`feat(orders): implement admin order list and detail endpoints`

---

### Estimated Effort
**Small**

---

### TASK-ID: EP-05-03

### Title
Angular: Order Submission Flow (Public)

---

### Objective
Build the customer-facing cart and order submission form with payment proof upload.

---

### Business Context
The order flow is the primary revenue action on the website. Customers add products to a local cart, fill out their delivery info, choose a payment method, and upload proof of payment.

---

### Scope
- **Included:** Cart state (local Angular signal or simple service), product detail "Add to Cart" button, cart summary page/drawer, order form (all fields from API spec), payment method selection, file upload for payment proofs, order success screen
- **Excluded:** Guest account, order tracking, WhatsApp ordering (external link only)

---

### Technical Details
1. `CartService`: manages a list of `{ productId, productNameAr, productNameEn, price, quantity, coverImageUrl }` items using Angular signals. Stored in `sessionStorage` (lost on tab close — no persistence in V1).
2. Cart drawer/modal: displays items, quantities (increase/decrease/remove), subtotal.
3. Order form page: customer info fields, governorate dropdown (static list of Egyptian governorates), payment method radio group.
4. Payment proof upload: file input accepting JPEG/PNG/PDF, max 5MB, displays file name after selection.
5. On submit: build `FormData`, serialize `items` as a JSON string, attach files, call `POST /orders`.
6. On success: show confirmation screen with order ID and message; clear cart.
7. On error: show field-level errors from the API response.

---

### Files to Create/Modify
- `frontend/src/app/core/services/cart.service.ts`
- `frontend/src/app/features/orders/pages/order-form-page/order-form-page.component.ts`
- `frontend/src/app/features/orders/pages/order-success-page/order-success-page.component.ts`
- `frontend/src/app/shared/components/cart-drawer/cart-drawer.component.ts`

---

### API Endpoints
- `POST /orders`

---

### Acceptance Criteria
- [ ] Adding a product to cart reflects immediately in the cart icon badge
- [ ] Order form validates all required fields before submission
- [ ] Payment proof file is required; missing file shows an error
- [ ] On successful submission, cart is cleared and success screen is shown
- [ ] API validation errors are displayed per field
- [ ] Form is fully usable on mobile (375px)

---

### Edge Cases
- Customer tries to submit with 0 items (empty cart): disable submit button or redirect to products
- File larger than 5MB: reject client-side before API call with a clear error message
- Network timeout during submission: show retry option

---

### Dependencies
`EP-01-02`, `EP-03-06`, `EP-05-01`

---

### Branch Name
`feature/ep05-order-flow`

---

### Commit Message
`feat(frontend/orders): implement customer order submission flow`

---

### Estimated Effort
**Large**

---

### TASK-ID: EP-05-04

### Title
Angular: Admin Orders Dashboard

---

### Objective
Build the admin orders dashboard with filtering, order detail view, and payment proof display.

---

### Business Context
Admins need to process incoming orders efficiently. Viewing payment proofs is the most critical action to confirm payment before shipping.

---

### Scope
- **Included:** Admin orders list with all filters, order detail page with all fields and payment proof images, filters panel
- **Excluded:** Order modification, status change, export

---

### Technical Details
1. Orders list: paginated table/card list (display all — no pagination in V1) with columns: customer name, phone, governorate, payment method, subtotal, date. Click to view detail.
2. Filters panel: customer name search, governorate dropdown, payment method select, date range pickers.
3. Order detail page: all order fields, items table (name, unit price, quantity, total), payment proof images displayed inline (thumbnail, click to open full size).

---

### Files to Create/Modify
- `frontend/src/app/features/admin/orders/pages/admin-orders-list/admin-orders-list.component.ts`
- `frontend/src/app/features/admin/orders/pages/admin-order-detail/admin-order-detail.component.ts`

---

### API Endpoints
- `GET /admin/orders`
- `GET /admin/orders/:id`

---

### Acceptance Criteria
- [ ] Orders list shows all orders sorted newest first
- [ ] All filter combinations produce correct results
- [ ] Order detail shows all items, customer info, and payment proof images
- [ ] Payment proof images open in a lightbox on click

---

### Edge Cases
- Order with multiple payment proofs: all must be visible
- Long customer name or address must not break the table layout

---

### Dependencies
`EP-02-02`, `EP-05-02`

---

### Branch Name
`feature/ep05-admin-orders-pages`

---

### Commit Message
`feat(frontend/admin): implement admin orders dashboard`

---

### Estimated Effort
**Medium**

---

---

## EP-06: OFFERS MANAGEMENT

---

### TASK-ID: EP-06-01

### Title
Backend: Offer Endpoints (Public + Admin)

---

### Objective
Implement all offer endpoints: active offers for public consumers, banner offers, and full admin CRUD with Cloudinary image management.

---

### Business Context
Offers are time-limited marketing content displayed on the home page, offers page, and optionally in the top banner. Activation is entirely date-driven.

---

### Scope
- **Included:** `GET /offers`, `GET /offers/banner`, `GET /admin/offers`, `POST /admin/offers`, `PATCH /admin/offers/:id`, `DELETE /admin/offers/:id`
- **Excluded:** Offer-product linking, discount codes (V2)

---

### Technical Details
1. Create `OffersModule` with `OffersController` and `OffersService`.
2. `GET /offers`: where `startDate <= now() AND endDate >= now()`. Order by `startDate` ASC. Include all fields.
3. `GET /offers/banner`: same date filter PLUS `showInTopBanner = true`.
4. `GET /admin/offers`: all offers regardless of dates. Order by `startDate` DESC. Returns `cloudinaryPublicId`.
5. `POST /admin/offers`: accept `multipart/form-data`. If `image` file provided, upload to Cloudinary `bionl/offers`. Store `imageUrl` and `cloudinaryPublicId`. Validate `endDate > startDate`.
6. `PATCH /admin/offers/:id`: accept `multipart/form-data`. If new `image` file provided, upload new, delete old from Cloudinary, update `imageUrl` and `cloudinaryPublicId`.
7. `DELETE /admin/offers/:id`: if offer has `cloudinaryPublicId`, delete image from Cloudinary. Delete offer record.

---

### Files to Create/Modify
- `backend/src/offers/offers.module.ts`
- `backend/src/offers/offers.controller.ts`
- `backend/src/offers/offers.service.ts`
- `backend/src/offers/dto/create-offer.dto.ts`
- `backend/src/offers/dto/update-offer.dto.ts`

---

### API Endpoints
**GET /offers** — Public  
**GET /offers/banner** — Public  
**GET /admin/offers** — Auth: Yes  
**POST /admin/offers** — Auth: Yes  
**PATCH /admin/offers/:id** — Auth: Yes  
**DELETE /admin/offers/:id** — Auth: Yes

---

### Database Impact
- **Model:** `Offer`
- **Fields:** `titleAr`, `titleEn`, `descriptionAr`, `descriptionEn`, `imageUrl`, `cloudinaryPublicId`, `showInTopBanner`, `startDate`, `endDate`

---

### Acceptance Criteria
- [ ] `GET /offers` returns only offers where now is between `startDate` and `endDate`
- [ ] `GET /offers/banner` returns only active offers with `showInTopBanner = true`
- [ ] `GET /admin/offers` returns ALL offers including past and future
- [ ] `POST /admin/offers` with `endDate <= startDate` returns 400
- [ ] `PATCH /admin/offers/:id` with a new image deletes the old one from Cloudinary
- [ ] `DELETE /admin/offers/:id` with an image deletes from Cloudinary before deleting the record
- [ ] `GET /offers` never returns `cloudinaryPublicId`

---

### Edge Cases
- Offer with no image: `imageUrl` and `cloudinaryPublicId` are `null`; the update must not attempt Cloudinary deletion
- Offer becomes active at exact `startDate` second; query must use `<=`

---

### Dependencies
`EP-01-01`, `EP-02-01`

---

### Branch Name
`feature/ep06-offers`

---

### Commit Message
`feat(offers): implement offer endpoints with cloudinary image management`

---

### Estimated Effort
**Medium**

---

### TASK-ID: EP-06-02

### Title
Angular: Offers Page and Top Banner

---

### Objective
Build the public offers page and the scrolling top banner component that displays active banner offers.

---

### Business Context
Offers are a marketing tool to drive sales. The top banner is visible on every page and must load with minimal delay.

---

### Scope
- **Included:** `/offers` page displaying active offers as cards, `TopBannerComponent` fetching `GET /offers/banner` and displaying scrolling text/cards, home page offer section
- **Excluded:** Admin UI

---

### Technical Details
1. `OffersService` (Angular): calls `GET /offers` and `GET /offers/banner`.
2. `OffersPageComponent`: grid of offer cards with title, description, dates, optional image.
3. `TopBannerComponent` (shared, placed in `PublicLayoutComponent`): fetches banner offers on app init. If the array is empty, the banner is hidden (zero height, no layout shift). Displays offer titles as horizontally scrolling text. Supports both AR and EN titles.
4. Offer cards must be mobile-first (full width on small screens).

---

### Files to Create/Modify
- `frontend/src/app/features/offers/pages/offers-page/offers-page.component.ts`
- `frontend/src/app/features/offers/offers.service.ts`
- `frontend/src/app/shared/components/top-banner/top-banner.component.ts`

---

### Acceptance Criteria
- [ ] Offers page shows only currently active offers
- [ ] Top banner is hidden when there are no active banner offers
- [ ] Top banner appears on all public pages (via `PublicLayoutComponent`)
- [ ] Offer titles switch between `titleAr` and `titleEn` based on language

---

### Edge Cases
- No active offers: shows empty state message on offers page
- No banner offers: no layout shift when banner is hidden

---

### Dependencies
`EP-01-02`, `EP-06-01`

---

### Branch Name
`feature/ep06-offers-frontend`

---

### Commit Message
`feat(frontend/offers): implement offers page and top banner component`

---

### Estimated Effort
**Small**

---

### TASK-ID: EP-06-03

### Title
Angular: Admin Offers Management

---

### Objective
Build admin pages for creating, editing, and deleting offers.

---

### Scope
- **Included:** Admin offers list, create/edit form with date pickers and optional image upload, delete with confirmation
- **Excluded:** Public-facing offer display

---

### Technical Details
1. Offers list: table with title, dates, `showInTopBanner` flag, active status (computed from dates), actions.
2. Create/Edit form: all bilingual fields, `startDate`/`endDate` date pickers, `showInTopBanner` checkbox, optional image upload with preview.
3. Active status indicator: highlight currently active offers in the list.
4. On edit with new image: the backend handles old image cleanup.

---

### Files to Create/Modify
- `frontend/src/app/features/admin/offers/pages/admin-offers-list/admin-offers-list.component.ts`
- `frontend/src/app/features/admin/offers/pages/admin-offer-form/admin-offer-form.component.ts`

---

### Acceptance Criteria
- [ ] Admin can create an offer with an optional image
- [ ] Admin can update all fields including replacing the image
- [ ] `endDate` before `startDate` shows a validation error
- [ ] Active offers are visually distinguished in the list
- [ ] Delete shows a confirmation dialog

---

### Dependencies
`EP-02-02`, `EP-06-01`

---

### Branch Name
`feature/ep06-admin-offers-pages`

---

### Commit Message
`feat(frontend/admin): implement admin offers management pages`

---

### Estimated Effort
**Small**

---

---

## EP-07: CONTACT MESSAGES

---

### TASK-ID: EP-07-01

### Title
Backend: Contact Endpoints (Public + Admin)

---

### Objective
Implement `POST /contact`, `GET /admin/contact-messages`, and `GET /admin/contact-messages/:id` (with auto-read marking).

---

### Business Context
The contact form is how potential customers and partners reach the company. Messages must be reliably saved and surfaced to admins. The n8n webhook provides real-time notifications.

---

### Scope
- **Included:** `POST /contact`, `GET /admin/contact-messages` (with `isRead` filter), `GET /admin/contact-messages/:id` (auto-marks read), n8n webhook on new message
- **Excluded:** Admin reply, admin delete (V1 is view-only)

---

### Technical Details
1. Create `ContactModule` with `ContactController` and `ContactService`.
2. `POST /contact`: validate all fields per API spec. Save `ContactMessage` with `isRead: false`. After save, fire `NEW_CONTACT_MESSAGE` webhook via `WebhookService` (async, non-blocking). Return `{ success: true, message: "Message sent successfully", data: null }`.
3. `GET /admin/contact-messages`: optional `isRead` query param (boolean). Return all messages ordered by `createdAt` DESC. Meta includes `{ total, unreadCount }`. `unreadCount` is the count of records where `isRead = false` regardless of the `isRead` filter applied.
4. `GET /admin/contact-messages/:id`: return the message and in the same DB call (or immediately after), update `isRead = true` using `prisma.contactMessage.update`.

---

### Files to Create/Modify
- `backend/src/contact/contact.module.ts`
- `backend/src/contact/contact.controller.ts`
- `backend/src/contact/contact.service.ts`
- `backend/src/contact/dto/create-contact-message.dto.ts`
- `backend/src/contact/dto/get-contact-messages-query.dto.ts`

---

### API Endpoints
**POST /contact** — Public  
**GET /admin/contact-messages** — Auth: Yes  
**GET /admin/contact-messages/:id** — Auth: Yes (auto-marks read)

---

### Database Impact
- **Model:** `ContactMessage`
- **Fields:** All fields + `isRead` toggle on `GET /:id`

---

### Acceptance Criteria
- [ ] `POST /contact` with valid data creates a message and returns `data: null`
- [ ] `POST /contact` with missing required fields returns 400
- [ ] n8n webhook failure does NOT fail the contact submission
- [ ] `GET /admin/contact-messages` returns `meta.unreadCount` reflecting all unread messages
- [ ] `GET /admin/contact-messages?isRead=false` returns only unread messages
- [ ] `GET /admin/contact-messages/:id` sets `isRead = true` on the record
- [ ] Calling `GET /admin/contact-messages/:id` twice: second call still returns the message (now with `isRead: true`)

---

### Edge Cases
- Empty `subject` field (only whitespace): treated as invalid — use `@Transform(({ value }) => value?.trim())` in the DTO
- Webhook fires even if the database save takes time; always fire after confirmed save

---

### Dependencies
`EP-01-01`, `EP-02-01`

---

### Branch Name
`feature/ep07-contact`

---

### Commit Message
`feat(contact): implement contact message submission and admin inbox endpoints`

---

### Estimated Effort
**Small**

---

### TASK-ID: EP-07-02

### Title
Angular: Contact Form (Public) and Admin Inbox

---

### Objective
Build the public contact form page and the admin contact messages inbox.

---

### Scope
- **Included:** `/contact` page with contact form, form validation, success state; admin contact messages list with unread badge, message detail view
- **Excluded:** Admin reply functionality

---

### Technical Details
1. Public contact form: all fields from API spec, bilingual labels, client-side validation matching server rules.
2. On submit: call `POST /contact`. Show success message in the same form area. Reset form.
3. Admin contact messages page: list view showing sender name, subject, date, read/unread badge. Click to open detail.
4. Admin header/sidebar: show badge with `unreadCount` from the contacts API.
5. Message detail: shows all fields. After opening, the message is visually marked as read.
6. Filter: unread / all toggle.

---

### Files to Create/Modify
- `frontend/src/app/features/contact/pages/contact-page/contact-page.component.ts`
- `frontend/src/app/features/contact/contact.service.ts`
- `frontend/src/app/features/admin/contact/pages/admin-contact-list/admin-contact-list.component.ts`
- `frontend/src/app/features/admin/contact/pages/admin-contact-detail/admin-contact-detail.component.ts`

---

### API Endpoints
- `POST /contact`
- `GET /admin/contact-messages`
- `GET /admin/contact-messages/:id`

---

### Acceptance Criteria
- [ ] Contact form submits successfully with valid data and shows a success message
- [ ] Required field validation errors shown before submission
- [ ] Admin inbox shows unread count badge
- [ ] Opening a message marks it as read (no separate "mark as read" button needed)
- [ ] Filter toggle shows all vs. unread messages

---

### Edge Cases
- Network error during form submission: show error with retry option (do not clear the form)

---

### Dependencies
`EP-01-02`, `EP-07-01`

---

### Branch Name
`feature/ep07-contact-frontend`

---

### Commit Message
`feat(frontend): implement contact form and admin inbox`

---

### Estimated Effort
**Small**

---

---

## EP-08: ANGULAR FRONTEND — REMAINING PAGES

---

### TASK-ID: EP-08-01

### Title
Angular: Home Page

---

### Objective
Build the home page with all required sections: hero, featured products, offers banner, category overview, and contact CTA.

---

### Scope
- **Included:** Hero section, featured products (first 4–6 from `GET /products`), active offers section (from `GET /offers`), category grid, WhatsApp CTA, contact CTA
- **Excluded:** Hardcoded content (all from API)

---

### Technical Details
1. `HomePageComponent` makes parallel API calls: `GET /products` (limited to 6), `GET /offers`, `GET /categories`.
2. Featured products: display `ProductCardComponent` in a horizontal scroll on mobile, grid on desktop.
3. Offers section: 2–3 offer cards. If no active offers, section is hidden.
4. Category grid: links to `/products?category=:slug`.
5. WhatsApp CTA: `<a href="https://wa.me/...">` link button.
6. Hero: static visual design with company name in AR/EN.

---

### Files to Create/Modify
- `frontend/src/app/features/home/pages/home-page/home-page.component.ts`

---

### API Endpoints
- `GET /products`
- `GET /offers`
- `GET /categories`

---

### Acceptance Criteria
- [ ] Home page is SSR-rendered
- [ ] Featured products and offers are pulled from the API, not hardcoded
- [ ] Category grid links to filtered products page
- [ ] WhatsApp CTA is visible and functional
- [ ] Page is mobile-first and renders correctly at 375px

---

### Dependencies
`EP-03-05`, `EP-06-02`, `EP-04-02`

---

### Branch Name
`feature/ep08-home-page`

---

### Commit Message
`feat(frontend): implement home page with all sections`

---

### Estimated Effort
**Medium**

---

### TASK-ID: EP-08-02

### Title
Angular: About Us Page

---

### Objective
Build the static about us page with company story, mission, vision, and team sections.

---

### Scope
- **Included:** Static about page at `/about` with bilingual content, SSR meta tags
- **Excluded:** CMS-driven content (static in V1)

---

### Technical Details
Content is static in V1 (no database entity for about content). Use bilingual content objects in the component. Set appropriate `<title>` and `<meta name="description">`.

---

### Files to Create/Modify
- `frontend/src/app/features/about/pages/about-page/about-page.component.ts`

---

### Acceptance Criteria
- [ ] About page renders server-side with correct meta tags
- [ ] Content switches between Arabic and English based on language service
- [ ] Page is mobile-first

---

### Dependencies
`EP-01-02`

---

### Branch Name
`feature/ep08-about-page`

---

### Commit Message
`feat(frontend): implement about us page`

---

### Estimated Effort
**Small**

---

### TASK-ID: EP-08-03

### Title
Angular: Admin Dashboard Overview

---

### Objective
Build the admin dashboard landing page with summary statistics.

---

### Scope
- **Included:** Dashboard with stats cards: total products, total categories, total orders, unread contact messages. Quick links to each module.
- **Excluded:** Charts, analytics, export

---

### Technical Details
Stats are computed from API responses: `GET /admin/products` (`meta.total`), `GET /categories` (`meta.total`), `GET /admin/orders` (`meta.total`), `GET /admin/contact-messages` (`meta.unreadCount`). All called in parallel on dashboard init.

---

### Files to Create/Modify
- `frontend/src/app/features/admin/dashboard/pages/dashboard-page/dashboard-page.component.ts`

---

### Acceptance Criteria
- [ ] Dashboard shows correct counts for all 4 stats
- [ ] All counts update on each dashboard visit
- [ ] Quick links navigate to the correct admin sections

---

### Dependencies
`EP-02-02`, `EP-03-07`, `EP-04-02`, `EP-05-04`, `EP-07-02`

---

### Branch Name
`feature/ep08-admin-dashboard`

---

### Commit Message
`feat(frontend/admin): implement admin dashboard overview page`

---

### Estimated Effort
**Small**

---

# 3. VALIDATION CHECK

| Check | Status |
|-------|--------|
| Every public API endpoint has a task | ✅ |
| Every admin API endpoint has a task | ✅ |
| All 9 database models covered | ✅ Admin, Product, ProductImage, Category, ProductCategory, Order, OrderItem, PaymentProof, Offer, ContactMessage |
| No orphan features | ✅ |
| No missing CRUD operations | ✅ |
| n8n webhooks (Orders + Contact) covered | ✅ |
| Cloudinary lifecycle (upload + delete) covered | ✅ All 4 Cloudinary-enabled models |
| Mobile-first UI specified in all frontend tasks | ✅ |
| Bilingual (AR/EN) addressed in all content tasks | ✅ |
| SSR addressed | ✅ EP-01-02, EP-03-05, EP-03-06, EP-08-01 |
| Security (bcrypt, rate limiting, file validation, CORS) | ✅ EP-02-01 |
| Seed script for admin accounts | ✅ EP-02-01 |

---

# 4. DEPENDENCY GRAPH

```
EP-01-01 (Backend Foundation)
├── EP-02-01 (Auth Backend)
│   ├── EP-03-02 (Admin Products CRUD)
│   │   ├── EP-03-03 (Gallery Images)
│   │   └── EP-03-04 (Cover Image Replace)
│   ├── EP-04-01 (Categories Backend)
│   ├── EP-05-02 (Admin Orders)
│   ├── EP-06-01 (Offers Backend)
│   └── EP-07-01 (Contact Backend)
├── EP-03-01 (Public Products)
│   └── EP-05-01 (Submit Order)
└── EP-04-01 (Categories Backend)
    └── EP-03-01 (Public Products)

EP-01-02 (Angular Scaffold)
├── EP-02-02 (Angular Auth)
│   ├── EP-03-07 (Admin Product Pages)
│   ├── EP-04-02 (Admin Category Pages)
│   ├── EP-05-04 (Admin Orders Pages)
│   ├── EP-06-03 (Admin Offers Pages)
│   └── EP-07-02 (Admin Contact)
│       └── EP-08-03 (Admin Dashboard)
├── EP-03-05 (Products Listing Page)
│   └── EP-03-06 (Product Detail Page)
│       └── EP-05-03 (Order Submission Flow)
├── EP-04-02 (Admin Category Pages)
├── EP-06-02 (Offers Page + Banner)
└── EP-07-02 (Contact Form)

EP-08-01 (Home Page) ← EP-03-05, EP-06-02, EP-04-02
EP-08-02 (About Page) ← EP-01-02
```

---

# 5. MVP BUILD ORDER

The following sequence ensures each step is testable and unblocked before the next begins.

| Step | Task(s) | What Becomes Testable |
|------|---------|----------------------|
| **1** | EP-01-01 | Backend starts, Prisma connects, DB migrated |
| **2** | EP-02-01 | Admin can log in; JWT cookie is issued |
| **3** | EP-04-01 | Categories CRUD works end-to-end (simplest domain) |
| **4** | EP-01-02 | Angular scaffold runs; login page renders |
| **5** | EP-02-02 | Angular auth guard works; admin can log in via UI |
| **6** | EP-04-02 | First admin feature usable: categories management |
| **7** | EP-03-02 | Admin can create products with cover images |
| **8** | EP-03-01 | Public can view products; filters work |
| **9** | EP-03-03 | Gallery images can be uploaded and reordered |
| **10** | EP-03-04 | Cover image can be replaced |
| **11** | EP-03-07 | Full admin product management via UI |
| **12** | EP-03-05 | Public products listing page live |
| **13** | EP-03-06 | Public product detail page with SEO meta tags |
| **14** | EP-06-01 | Offers CRUD (backend) |
| **15** | EP-06-02 | Offers page + top banner live |
| **16** | EP-06-03 | Admin can manage offers |
| **17** | EP-07-01 | Contact form backend + n8n webhook |
| **18** | EP-07-02 | Contact form live; admin inbox working |
| **19** | EP-05-01 | Order submission backend with payment proof upload |
| **20** | EP-05-02 | Admin order list and detail endpoints |
| **21** | EP-05-03 | Customer-facing cart and order flow live |
| **22** | EP-05-04 | Admin orders dashboard live |
| **23** | EP-08-01 | Home page assembled with all sections |
| **24** | EP-08-02 | About page |
| **25** | EP-08-03 | Admin dashboard overview with stats |

> **MVP Gate (Step 21):** After step 21, the platform is end-to-end functional: admins can manage the catalog, customers can browse products and submit orders with payment proofs, and contact messages are captured. Steps 22–25 complete the remaining UI surfaces.
