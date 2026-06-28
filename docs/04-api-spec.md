# REST API Specification

## Project

Bio NL Pharmaceuticals

## Version

1.0 — Production-Ready

## Last Updated

2026-06-28

---

# Table of Contents

1. [Overview](#overview)
2. [Base URL & Versioning](#base-url--versioning)
3. [Authentication](#authentication)
4. [Standard Response Envelope](#standard-response-envelope)
5. [Error Handling](#error-handling)
6. [Auth Endpoints](#auth-endpoints)
7. [Products — Public](#products--public)
8. [Products — Admin](#products--admin)
9. [Categories — Public](#categories--public)
10. [Categories — Admin](#categories--admin)
11. [Orders — Public](#orders--public)
12. [Orders — Admin](#orders--admin)
13. [Offers — Public](#offers--public)
14. [Offers — Admin](#offers--admin)
15. [Contact — Public](#contact--public)
16. [Contact — Admin](#contact--admin)

---

# Overview

This document defines the complete REST API for the Bio NL Pharmaceuticals platform.

The API is built using NestJS and follows RESTful conventions. All responses follow a consistent JSON envelope. Media files are stored on Cloudinary. Admin routes are protected by JWT authentication stored in HttpOnly cookies.

---

# Base URL & Versioning

```
Production:   https://api.bionlpharma.com/api
Development:  http://localhost:3000/api
```

No URL versioning in V1. If versioning becomes necessary in V2, the pattern will be `/api/v2/`.

---

# Authentication

## Strategy

* **JWT** stored in an **HttpOnly, Secure, SameSite=Strict** cookie named `access_token`.
* Token expiry: **24 hours**.
* No refresh token in V1.
* All admin-protected routes require a valid JWT cookie.
* Public routes do not require authentication.

## Guards

All routes under `/admin/*` (except `POST /auth/login`) are protected by a JWT guard that reads the cookie and validates the token.

## Cookie Specification

| Property | Value |
|---|---|
| Name | `access_token` |
| HttpOnly | true |
| Secure | true (production) |
| SameSite | Strict |
| Path | / |
| Max-Age | 86400 (24 hours in seconds) |

---

# Standard Response Envelope

All API responses follow this consistent structure:

```json
{
  "success": true,
  "message": "Human-readable description of the result",
  "data": { },
  "meta": null
}
```

## Fields

| Field | Type | Description |
|---|---|---|
| `success` | boolean | `true` for successful responses, `false` for errors |
| `message` | string | Human-readable description |
| `data` | object \| array \| null | The response payload |
| `meta` | object \| null | Pagination or additional context. `null` if not applicable |

## Example — Single Resource

```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": "uuid",
    "slug": "bio-hair-oil",
    "nameAr": "زيت الشعر بيو",
    "nameEn": "Bio Hair Oil"
  },
  "meta": null
}
```

## Example — Collection

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    { "id": "uuid", "slug": "bio-hair-oil" }
  ],
  "meta": {
    "total": 42
  }
}
```

## Example — Error

```json
{
  "success": false,
  "message": "Product not found",
  "data": null,
  "meta": null
}
```

---

# Error Handling

## HTTP Status Codes

| Code | Meaning | When Used |
|---|---|---|
| `200` | OK | Successful GET, PATCH, DELETE |
| `201` | Created | Successful POST that creates a resource |
| `400` | Bad Request | Validation error, malformed request body |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | Authenticated but not authorized for this action |
| `404` | Not Found | Resource does not exist |
| `500` | Internal Server Error | Unexpected server-side failure |

## Validation Error Response (400)

```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "errors": [
      { "field": "phoneNumber", "message": "phoneNumber must be a valid phone number" },
      { "field": "paymentMethod", "message": "paymentMethod must be one of: INSTAPAY, VODAFONE_CASH" }
    ]
  },
  "meta": null
}
```

---

# Auth Endpoints

## POST /auth/login

Login with admin credentials. Sets the JWT in an HttpOnly cookie.

**Auth Required:** No

**Request Body:**

```json
{
  "email": "admin@bionlpharma.com",
  "password": "SecurePassword123"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `email` | string | Yes | Valid email format |
| `password` | string | Yes | Minimum 8 characters |

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "id": "uuid",
      "email": "admin@bionlpharma.com",
      "fullName": "Ahmed Hassan"
    }
  },
  "meta": null
}
```

**Set-Cookie Header (automatic):**
```
Set-Cookie: access_token=<jwt>; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
```

**Error Responses:**

| Status | Condition |
|---|---|
| 400 | Missing or invalid email/password format |
| 401 | Invalid credentials |

---

## POST /auth/logout

Clears the JWT cookie server-side. Effectively logs out the admin.

**Auth Required:** Yes (JWT Cookie)

**Request Body:** None

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Logout successful",
  "data": null,
  "meta": null
}
```

**Set-Cookie Header (automatic):**
```
Set-Cookie: access_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0
```

**Error Responses:**

| Status | Condition |
|---|---|
| 401 | No active session / invalid token |

---

## GET /auth/me

Returns the currently authenticated admin's profile.

**Auth Required:** Yes (JWT Cookie)

**Request Body:** None

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Admin profile retrieved successfully",
  "data": {
    "id": "uuid",
    "email": "admin@bionlpharma.com",
    "fullName": "Ahmed Hassan",
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 401 | Token missing or expired |

---

# Products — Public

## GET /products

Retrieve all published products. Returns both Arabic and English fields. No pagination in V1.

**Auth Required:** No

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `category` | string | No | Filter by category slug (e.g. `?category=derma`) |
| `search` | string | No | Search by product name (searches nameAr and nameEn) |
| `minPrice` | number | No | Filter products with price >= minPrice |
| `maxPrice` | number | No | Filter products with price <= maxPrice |

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "slug": "bio-hair-oil",
      "nameAr": "زيت الشعر بيو",
      "nameEn": "Bio Hair Oil",
      "descriptionAr": "وصف المنتج بالعربية",
      "descriptionEn": "Product description in English",
      "ingredientsAr": "المكونات بالعربية",
      "ingredientsEn": "Ingredients in English",
      "usageInstructionsAr": "تعليمات الاستخدام بالعربية",
      "usageInstructionsEn": "Usage instructions in English",
      "price": "150.00",
      "coverImageUrl": "https://res.cloudinary.com/...",
      "categories": [
        {
          "id": "uuid",
          "slug": "derma",
          "nameAr": "ديرما",
          "nameEn": "Derma"
        }
      ],
      "images": [
        {
          "id": "uuid",
          "imageUrl": "https://res.cloudinary.com/...",
          "displayOrder": 1
        }
      ],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 42
  }
}
```

**Notes:**

* `cloudinaryPublicId` fields are **never** returned to public clients.
* If `category` filter does not match any category slug, an empty array is returned (not 404).
* `search` is case-insensitive and partial-match.

---

## GET /products/:slug

Retrieve a single product by its SEO slug.

**Auth Required:** No

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `slug` | string | Yes | Product slug (e.g. `bio-hair-oil`) |

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Product retrieved successfully",
  "data": {
    "id": "uuid",
    "slug": "bio-hair-oil",
    "nameAr": "زيت الشعر بيو",
    "nameEn": "Bio Hair Oil",
    "descriptionAr": "وصف المنتج بالعربية",
    "descriptionEn": "Product description in English",
    "ingredientsAr": "المكونات بالعربية",
    "ingredientsEn": "Ingredients in English",
    "usageInstructionsAr": "تعليمات الاستخدام بالعربية",
    "usageInstructionsEn": "Usage instructions in English",
    "price": "150.00",
    "coverImageUrl": "https://res.cloudinary.com/...",
    "categories": [
      {
        "id": "uuid",
        "slug": "derma",
        "nameAr": "ديرما",
        "nameEn": "Derma"
      }
    ],
    "images": [
      {
        "id": "uuid",
        "imageUrl": "https://res.cloudinary.com/...",
        "displayOrder": 1
      }
    ],
    "relatedProducts": [
      {
        "id": "uuid",
        "slug": "bio-face-cream",
        "nameAr": "كريم الوجه بيو",
        "nameEn": "Bio Face Cream",
        "price": "120.00",
        "coverImageUrl": "https://res.cloudinary.com/..."
      }
    ],
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  "meta": null
}
```

**Notes:**

* `relatedProducts` are products that share at least one category with the current product. Maximum 4 results. Excludes the current product.
* `cloudinaryPublicId` fields are never returned to public clients.

**Error Responses:**

| Status | Condition |
|---|---|
| 404 | Product with provided slug does not exist |

---

# Products — Admin

All endpoints under `/admin/products` require authentication.

---

## GET /admin/products

Retrieve all products for the admin dashboard (includes full details).

**Auth Required:** Yes

**Query Parameters:** Same as `GET /products` (optional filters).

**Response — 200 OK:**

Same structure as `GET /products` but also includes `coverImagePublicId` (admin only).

```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "slug": "bio-hair-oil",
      "nameAr": "زيت الشعر بيو",
      "nameEn": "Bio Hair Oil",
      "price": "150.00",
      "coverImageUrl": "https://res.cloudinary.com/...",
      "coverImagePublicId": "bionl/products/cover_xyz",
      "categories": [ ... ],
      "images": [
        {
          "id": "uuid",
          "imageUrl": "https://res.cloudinary.com/...",
          "cloudinaryPublicId": "bionl/products/gallery_abc",
          "displayOrder": 1
        }
      ],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 42
  }
}
```

---

## GET /admin/products/:id

Retrieve a single product by UUID for the admin dashboard.

**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Product UUID |

**Response — 200 OK:** Same as single product response above (admin version with publicIds).

**Error Responses:**

| Status | Condition |
|---|---|
| 404 | Product not found |

---

## POST /admin/products

Create a new product. The cover image is uploaded as a multipart file.

**Auth Required:** Yes

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `nameAr` | string | Yes | Min 2 chars |
| `nameEn` | string | Yes | Min 2 chars. Slug is auto-generated from this field. |
| `descriptionAr` | string | Yes | Min 10 chars |
| `descriptionEn` | string | Yes | Min 10 chars |
| `ingredientsAr` | string | No | — |
| `ingredientsEn` | string | No | — |
| `usageInstructionsAr` | string | No | — |
| `usageInstructionsEn` | string | No | — |
| `price` | number | Yes | Positive decimal |
| `categoryIds` | string[] | No | Array of valid Category UUIDs |
| `coverImage` | file | Yes | JPEG/PNG/WEBP, max 5MB |

**Slug Generation Rules:**

1. Convert `nameEn` to lowercase.
2. Replace spaces and special characters with hyphens.
3. Remove consecutive hyphens.
4. If slug already exists, append `-2`, `-3`, etc. until unique.

**Response — 201 Created:**

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": "uuid",
    "slug": "bio-hair-oil",
    "nameAr": "زيت الشعر بيو",
    "nameEn": "Bio Hair Oil",
    "descriptionAr": "...",
    "descriptionEn": "...",
    "ingredientsAr": null,
    "ingredientsEn": null,
    "usageInstructionsAr": null,
    "usageInstructionsEn": null,
    "price": "150.00",
    "coverImageUrl": "https://res.cloudinary.com/...",
    "coverImagePublicId": "bionl/products/cover_xyz",
    "categories": [ ... ],
    "images": [],
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 400 | Validation failed (missing fields, invalid price, invalid categoryIds) |
| 400 | Cover image missing or invalid file type/size |
| 401 | Unauthorized |

---

## PATCH /admin/products/:id

Update an existing product's text fields and/or categories. Does NOT handle image uploads (use dedicated image endpoints).

**Auth Required:** Yes

**Content-Type:** `application/json`

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Product UUID |

**Request Body (all fields optional — only include fields to update):**

```json
{
  "nameAr": "زيت الشعر بيو المحدّث",
  "nameEn": "Bio Hair Oil Updated",
  "descriptionAr": "وصف محدّث",
  "descriptionEn": "Updated description",
  "ingredientsAr": "مكونات",
  "ingredientsEn": "Ingredients",
  "usageInstructionsAr": "تعليمات",
  "usageInstructionsEn": "Instructions",
  "price": 175.00,
  "categoryIds": ["uuid-1", "uuid-2"]
}
```

**Notes:**

* Updating `nameEn` does NOT regenerate the slug. The slug is permanent after creation to avoid breaking SEO URLs.
* Providing `categoryIds` replaces the full category association (not additive).

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": { /* full updated product object (admin version) */ },
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 400 | Validation failed |
| 401 | Unauthorized |
| 404 | Product not found |

---

## DELETE /admin/products/:id

Delete a product and all its associated data.

**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Product UUID |

**Deletion Cascade (in order):**

1. Delete all gallery images from Cloudinary (using stored `cloudinaryPublicId`).
2. Delete the cover image from Cloudinary (using stored `coverImagePublicId`).
3. Delete all `ProductImage` records from database.
4. Delete all `ProductCategory` join records.
5. Set `productId` to `null` on associated `OrderItem` records (soft reference).
6. Delete the `Product` record.

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": null,
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 401 | Unauthorized |
| 404 | Product not found |

---

## POST /admin/products/:id/images

Upload one or more additional gallery images for a product.

**Auth Required:** Yes

**Content-Type:** `multipart/form-data`

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Product UUID |

**Form Fields:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `images` | file[] | Yes | JPEG/PNG/WEBP, max 5MB each, max 10 files per request |

**Response — 201 Created:**

```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "data": [
    {
      "id": "uuid",
      "imageUrl": "https://res.cloudinary.com/...",
      "cloudinaryPublicId": "bionl/products/gallery_abc",
      "displayOrder": 1
    },
    {
      "id": "uuid",
      "imageUrl": "https://res.cloudinary.com/...",
      "cloudinaryPublicId": "bionl/products/gallery_def",
      "displayOrder": 2
    }
  ],
  "meta": null
}
```

**Notes:**

* `displayOrder` for new images starts after the highest existing `displayOrder` value.

**Error Responses:**

| Status | Condition |
|---|---|
| 400 | No files uploaded, invalid file type, or file too large |
| 401 | Unauthorized |
| 404 | Product not found |

---

## DELETE /admin/products/:id/images/:imageId

Delete a single gallery image from both Cloudinary and the database.

**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Product UUID |
| `imageId` | string (UUID) | Yes | ProductImage UUID |

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Image deleted successfully",
  "data": null,
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 401 | Unauthorized |
| 404 | Product or image not found |
| 400 | Image does not belong to the specified product |

---

## PATCH /admin/products/:id/cover-image

Replace the cover image of a product.

**Auth Required:** Yes

**Content-Type:** `multipart/form-data`

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Product UUID |

**Form Fields:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `coverImage` | file | Yes | JPEG/PNG/WEBP, max 5MB |

**Behavior:**

1. Upload the new image to Cloudinary.
2. Delete the old cover image from Cloudinary using the stored `coverImagePublicId`.
3. Update `coverImageUrl` and `coverImagePublicId` on the Product record.

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Cover image updated successfully",
  "data": {
    "coverImageUrl": "https://res.cloudinary.com/...",
    "coverImagePublicId": "bionl/products/cover_new_xyz"
  },
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 400 | Missing file or invalid file type/size |
| 401 | Unauthorized |
| 404 | Product not found |

---

## PATCH /admin/products/:id/images/reorder

Update the `displayOrder` of gallery images.

**Auth Required:** Yes

**Content-Type:** `application/json`

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Product UUID |

**Request Body:**

```json
{
  "images": [
    { "id": "uuid-image-1", "displayOrder": 1 },
    { "id": "uuid-image-2", "displayOrder": 2 },
    { "id": "uuid-image-3", "displayOrder": 3 }
  ]
}
```

**Validation:**

* All provided `id` values must belong to the specified product.
* `displayOrder` values must be positive integers.

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Image order updated successfully",
  "data": null,
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 400 | Validation failed or image IDs do not belong to this product |
| 401 | Unauthorized |
| 404 | Product not found |

---

# Categories — Public

## GET /categories

Retrieve all categories.

**Auth Required:** No

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Categories retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "slug": "derma",
      "nameAr": "ديرما",
      "nameEn": "Derma",
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 4
  }
}
```

---

# Categories — Admin

## POST /admin/categories

Create a new category.

**Auth Required:** Yes

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "nameAr": "ديرما",
  "nameEn": "Derma"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `nameAr` | string | Yes | Min 2 chars |
| `nameEn` | string | Yes | Min 2 chars. Slug auto-generated from this. |

**Slug Generation:** Same rules as Product slug generation.

**Response — 201 Created:**

```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": "uuid",
    "slug": "derma",
    "nameAr": "ديرما",
    "nameEn": "Derma",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 400 | Validation failed |
| 401 | Unauthorized |

---

## PATCH /admin/categories/:id

Update a category.

**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Category UUID |

**Request Body (all optional):**

```json
{
  "nameAr": "ديرما المحدّثة",
  "nameEn": "Derma Updated"
}
```

**Notes:**

* Updating `nameEn` does NOT regenerate the slug (same SEO preservation rule as products).

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": "uuid",
    "slug": "derma",
    "nameAr": "ديرما المحدّثة",
    "nameEn": "Derma Updated",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 400 | Validation failed |
| 401 | Unauthorized |
| 404 | Category not found |

---

## DELETE /admin/categories/:id

Delete a category.

**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Category UUID |

**Behavior:**

* Deletes all `ProductCategory` join records for this category.
* Does NOT delete any products.
* Products previously in this category become uncategorized.

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Category deleted successfully",
  "data": null,
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 401 | Unauthorized |
| 404 | Category not found |

---

# Orders — Public

## POST /orders

Submit a new customer order with payment proof(s).

**Auth Required:** No

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `customerName` | string | Yes | Min 2 chars |
| `phoneNumber` | string | Yes | Valid phone number format |
| `email` | string | No | Valid email if provided |
| `governorate` | string | Yes | Min 2 chars |
| `cityOrCenterOrVillage` | string | Yes | Min 2 chars |
| `address` | string | Yes | Min 5 chars |
| `notes` | string | No | Max 500 chars |
| `paymentMethod` | string | Yes | Enum: `INSTAPAY` or `VODAFONE_CASH` |
| `items` | JSON string | Yes | JSON array of order items (see below) |
| `paymentProofs` | file[] | Yes | Min 1 file, JPEG/PNG/PDF, max 5MB each |

**`items` JSON Structure (sent as a JSON string in the form field):**

```json
[
  {
    "productId": "uuid",
    "quantity": 2
  },
  {
    "productId": "uuid",
    "quantity": 1
  }
]
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `productId` | string (UUID) | Yes | Must reference a valid existing product |
| `quantity` | integer | Yes | Min 1 |

**Backend Processing:**

1. Validate all `productId` values exist in the database.
2. For each item, fetch the current product price and name (both languages).
3. Create `OrderItem` records with a **price snapshot** (unit price at time of order).
4. Calculate `subtotalAmount` = sum of all (unitPrice × quantity).
5. Upload each payment proof file to Cloudinary.
6. Create `PaymentProof` records with Cloudinary URLs.
7. Create the `Order` record.
8. Fire the n8n webhook (async, non-blocking — order creation must not fail if webhook fails).

**Response — 201 Created:**

```json
{
  "success": true,
  "message": "Order submitted successfully",
  "data": {
    "id": "uuid",
    "customerName": "محمد أحمد",
    "phoneNumber": "+201234567890",
    "email": null,
    "governorate": "القاهرة",
    "cityOrCenterOrVillage": "مدينة نصر",
    "address": "شارع عباس العقاد",
    "notes": null,
    "paymentMethod": "INSTAPAY",
    "subtotalAmount": "450.00",
    "items": [
      {
        "id": "uuid",
        "productNameAr": "زيت الشعر بيو",
        "productNameEn": "Bio Hair Oil",
        "unitPrice": "150.00",
        "quantity": 2,
        "totalPrice": "300.00"
      },
      {
        "id": "uuid",
        "productNameAr": "كريم الوجه بيو",
        "productNameEn": "Bio Face Cream",
        "unitPrice": "150.00",
        "quantity": 1,
        "totalPrice": "150.00"
      }
    ],
    "paymentProofs": [
      {
        "id": "uuid",
        "imageUrl": "https://res.cloudinary.com/...",
        "uploadedAt": "2026-01-01T00:00:00.000Z"
      }
    ],
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "meta": null
}
```

**n8n Webhook Payload (fired asynchronously):**

```json
{
  "event": "NEW_ORDER",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "data": {
    "orderId": "uuid",
    "customerName": "محمد أحمد",
    "phoneNumber": "+201234567890",
    "governorate": "القاهرة",
    "paymentMethod": "INSTAPAY",
    "subtotalAmount": "450.00",
    "itemCount": 2
  }
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 400 | Validation failed (missing fields, invalid items format) |
| 400 | One or more productId values do not exist |
| 400 | No payment proof uploaded |
| 400 | Invalid file type or file too large |

---

# Orders — Admin

## GET /admin/orders

Retrieve all orders with optional filters.

**Auth Required:** Yes

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `customerName` | string | No | Partial, case-insensitive match on `customerName` |
| `phoneNumber` | string | No | Partial match on `phoneNumber` |
| `governorate` | string | No | Exact match on `governorate` |
| `paymentMethod` | string | No | Enum: `INSTAPAY` or `VODAFONE_CASH` |
| `dateFrom` | string (ISO 8601) | No | Filter orders created on or after this date |
| `dateTo` | string (ISO 8601) | No | Filter orders created on or before this date |

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Orders retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "customerName": "محمد أحمد",
      "phoneNumber": "+201234567890",
      "email": null,
      "governorate": "القاهرة",
      "cityOrCenterOrVillage": "مدينة نصر",
      "address": "شارع عباس العقاد",
      "notes": null,
      "paymentMethod": "INSTAPAY",
      "subtotalAmount": "450.00",
      "items": [
        {
          "id": "uuid",
          "productId": "uuid-or-null",
          "productNameAr": "زيت الشعر بيو",
          "productNameEn": "Bio Hair Oil",
          "unitPrice": "150.00",
          "quantity": 2,
          "totalPrice": "300.00"
        }
      ],
      "paymentProofs": [
        {
          "id": "uuid",
          "imageUrl": "https://res.cloudinary.com/...",
          "uploadedAt": "2026-01-01T00:00:00.000Z"
        }
      ],
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 128
  }
}
```

**Notes:**

* Results are ordered by `createdAt` descending (newest first).

---

## GET /admin/orders/:id

Retrieve a single order by UUID.

**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Order UUID |

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Order retrieved successfully",
  "data": {
    /* Same as single order object in GET /admin/orders */
  },
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 401 | Unauthorized |
| 404 | Order not found |

---

# Offers — Public

## GET /offers

Retrieve all currently active offers (where current datetime is between `startDate` and `endDate`).

**Auth Required:** No

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Offers retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "titleAr": "عرض رمضان",
      "titleEn": "Ramadan Offer",
      "descriptionAr": "وصف العرض بالعربية",
      "descriptionEn": "Offer description in English",
      "imageUrl": "https://res.cloudinary.com/...",
      "showInTopBanner": true,
      "startDate": "2026-03-01T00:00:00.000Z",
      "endDate": "2026-04-01T00:00:00.000Z",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 3
  }
}
```

---

## GET /offers/banner

Retrieve currently active offers that are flagged for the top scrolling banner (`showInTopBanner = true`).

**Auth Required:** No

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Banner offers retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "titleAr": "عرض رمضان",
      "titleEn": "Ramadan Offer",
      "descriptionAr": "وصف العرض",
      "descriptionEn": "Offer description",
      "imageUrl": null,
      "showInTopBanner": true,
      "startDate": "2026-03-01T00:00:00.000Z",
      "endDate": "2026-04-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1
  }
}
```

**Notes:**

* Returns an empty array if no active banner offers exist. The frontend handles the no-banner state.

---

# Offers — Admin

## GET /admin/offers

Retrieve all offers (active and inactive) for the admin dashboard.

**Auth Required:** Yes

**Response — 200 OK:**

Same structure as `GET /offers` but returns ALL offers regardless of date (past, present, and future).

```json
{
  "success": true,
  "message": "All offers retrieved successfully",
  "data": [ /* all offers, ordered by startDate descending */ ],
  "meta": {
    "total": 10
  }
}
```

---

## POST /admin/offers

Create a new offer.

**Auth Required:** Yes

**Content-Type:** `multipart/form-data`

**Form Fields:**

| Field | Type | Required | Validation |
|---|---|---|---|
| `titleAr` | string | Yes | Min 2 chars |
| `titleEn` | string | Yes | Min 2 chars |
| `descriptionAr` | string | No | — |
| `descriptionEn` | string | No | — |
| `showInTopBanner` | boolean | No | Default: false |
| `startDate` | string (ISO 8601) | Yes | Must be a valid date |
| `endDate` | string (ISO 8601) | Yes | Must be after `startDate` |
| `image` | file | No | JPEG/PNG/WEBP, max 5MB |

**Response — 201 Created:**

```json
{
  "success": true,
  "message": "Offer created successfully",
  "data": {
    "id": "uuid",
    "titleAr": "عرض رمضان",
    "titleEn": "Ramadan Offer",
    "descriptionAr": null,
    "descriptionEn": null,
    "imageUrl": "https://res.cloudinary.com/...",
    "showInTopBanner": false,
    "startDate": "2026-03-01T00:00:00.000Z",
    "endDate": "2026-04-01T00:00:00.000Z",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  },
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 400 | Validation failed or `endDate` is before `startDate` |
| 401 | Unauthorized |

---

## PATCH /admin/offers/:id

Update an offer.

**Auth Required:** Yes

**Content-Type:** `multipart/form-data`

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Offer UUID |

**Form Fields (all optional):**

| Field | Type | Required | Validation |
|---|---|---|---|
| `titleAr` | string | No | Min 2 chars |
| `titleEn` | string | No | Min 2 chars |
| `descriptionAr` | string | No | — |
| `descriptionEn` | string | No | — |
| `showInTopBanner` | boolean | No | — |
| `startDate` | string (ISO 8601) | No | — |
| `endDate` | string (ISO 8601) | No | Must be after `startDate` if both provided |
| `image` | file | No | Replaces existing image if provided |

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Offer updated successfully",
  "data": { /* full updated offer object */ },
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 400 | Validation failed |
| 401 | Unauthorized |
| 404 | Offer not found |

---

## DELETE /admin/offers/:id

Delete an offer.

**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | Offer UUID |

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Offer deleted successfully",
  "data": null,
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 401 | Unauthorized |
| 404 | Offer not found |

---

# Contact — Public

## POST /contact

Submit a contact message through the public contact form.

**Auth Required:** No

**Content-Type:** `application/json`

**Request Body:**

```json
{
  "fullName": "محمد أحمد",
  "phoneNumber": "+201234567890",
  "email": "customer@example.com",
  "subject": "استفسار عن منتج",
  "message": "أريد معرفة المزيد عن زيت الشعر بيو"
}
```

| Field | Type | Required | Validation |
|---|---|---|---|
| `fullName` | string | Yes | Min 2 chars |
| `phoneNumber` | string | Yes | Valid phone number |
| `email` | string | No | Valid email if provided |
| `subject` | string | Yes | Min 2 chars, max 200 chars |
| `message` | string | Yes | Min 10 chars, max 2000 chars |

**Backend Processing:**

1. Validate and save the message to the database.
2. Fire the n8n webhook (async, non-blocking — message must be saved even if webhook fails).

**Response — 201 Created:**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": null,
  "meta": null
}
```

**Notes:**

* The `data` field is intentionally `null` for contact submissions (no need to expose the saved record to the public).

**n8n Webhook Payload (fired asynchronously):**

```json
{
  "event": "NEW_CONTACT_MESSAGE",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "data": {
    "messageId": "uuid",
    "fullName": "محمد أحمد",
    "phoneNumber": "+201234567890",
    "email": "customer@example.com",
    "subject": "استفسار عن منتج"
  }
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 400 | Validation failed (missing required fields, invalid format) |

---

# Contact — Admin

## GET /admin/contact-messages

Retrieve all contact messages.

**Auth Required:** Yes

**Query Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `isRead` | boolean | No | Filter by read status (`true` or `false`) |

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Contact messages retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "fullName": "محمد أحمد",
      "phoneNumber": "+201234567890",
      "email": "customer@example.com",
      "subject": "استفسار عن منتج",
      "message": "أريد معرفة المزيد عن زيت الشعر بيو",
      "isRead": false,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 15,
    "unreadCount": 7
  }
}
```

**Notes:**

* Results ordered by `createdAt` descending (newest first).
* `unreadCount` in meta helps the admin badge/notification display.

---

## GET /admin/contact-messages/:id

Retrieve a single contact message and automatically mark it as read.

**Auth Required:** Yes

**Path Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `id` | string (UUID) | Yes | ContactMessage UUID |

**Behavior:**

* When this endpoint is called, `isRead` is automatically set to `true` on the record.

**Response — 200 OK:**

```json
{
  "success": true,
  "message": "Contact message retrieved successfully",
  "data": {
    "id": "uuid",
    "fullName": "محمد أحمد",
    "phoneNumber": "+201234567890",
    "email": "customer@example.com",
    "subject": "استفسار عن منتج",
    "message": "أريد معرفة المزيد عن زيت الشعر بيو",
    "isRead": true,
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "meta": null
}
```

**Error Responses:**

| Status | Condition |
|---|---|
| 401 | Unauthorized |
| 404 | Message not found |

---

# API Endpoint Summary

## Public Routes (No Authentication)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/products` | List all products (with optional filters) |
| `GET` | `/products/:slug` | Get product details by slug |
| `GET` | `/categories` | List all categories |
| `GET` | `/offers` | List all active offers |
| `GET` | `/offers/banner` | List active banner offers only |
| `POST` | `/orders` | Submit a new customer order |
| `POST` | `/contact` | Submit a contact message |

## Auth Routes

| Method | Endpoint | Auth Required | Description |
|--------|----------|--------------|-------------|
| `POST` | `/auth/login` | No | Admin login |
| `POST` | `/auth/logout` | Yes | Admin logout |
| `GET` | `/auth/me` | Yes | Get current admin profile |

## Admin Routes (Authentication Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/admin/products` | List all products (admin view) |
| `GET` | `/admin/products/:id` | Get product by UUID |
| `POST` | `/admin/products` | Create a new product |
| `PATCH` | `/admin/products/:id` | Update product text/categories |
| `DELETE` | `/admin/products/:id` | Delete product + Cloudinary cleanup |
| `POST` | `/admin/products/:id/images` | Upload gallery images |
| `DELETE` | `/admin/products/:id/images/:imageId` | Delete gallery image |
| `PATCH` | `/admin/products/:id/cover-image` | Replace cover image |
| `PATCH` | `/admin/products/:id/images/reorder` | Reorder gallery images |
| `GET` | `/admin/categories` | — (use public `GET /categories`) |
| `POST` | `/admin/categories` | Create a category |
| `PATCH` | `/admin/categories/:id` | Update a category |
| `DELETE` | `/admin/categories/:id` | Delete a category |
| `GET` | `/admin/offers` | List all offers (active + inactive) |
| `POST` | `/admin/offers` | Create an offer |
| `PATCH` | `/admin/offers/:id` | Update an offer |
| `DELETE` | `/admin/offers/:id` | Delete an offer |
| `GET` | `/admin/orders` | List orders (with filters) |
| `GET` | `/admin/orders/:id` | Get order by UUID |
| `GET` | `/admin/contact-messages` | List contact messages |
| `GET` | `/admin/contact-messages/:id` | Get message (auto-marks as read) |

---

# n8n Webhook Integration

## Configuration

Webhook URLs are configured via environment variables:

```
N8N_ORDER_WEBHOOK_URL=https://your-n8n-instance/webhook/new-order
N8N_CONTACT_WEBHOOK_URL=https://your-n8n-instance/webhook/new-contact
```

## Behavior

* Webhooks are fired **asynchronously** using a non-blocking HTTP call after the main database transaction completes.
* A webhook failure must **never** cause the API request to fail.
* Retry logic (if required) is handled by n8n, not the NestJS backend.
* Payload is sent as `POST` with `Content-Type: application/json`.

## Events

| Event | Trigger | Env Variable |
|-------|---------|--------------|
| `NEW_ORDER` | Customer submits an order | `N8N_ORDER_WEBHOOK_URL` |
| `NEW_CONTACT_MESSAGE` | Customer submits a contact message | `N8N_CONTACT_WEBHOOK_URL` |

---

# Environment Variables Reference

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/bionl_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_here

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# n8n Webhooks
N8N_ORDER_WEBHOOK_URL=https://your-n8n-instance/webhook/new-order
N8N_CONTACT_WEBHOOK_URL=https://your-n8n-instance/webhook/new-contact

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://bionlpharma.com
```

---

# Security Considerations

| Concern | Approach |
|---------|----------|
| Admin authentication | JWT in HttpOnly cookie, not accessible by JavaScript |
| Password storage | bcrypt with salt rounds >= 12 |
| File upload validation | MIME type + file size enforced on backend (not just extension) |
| Input validation | All DTOs validated with `class-validator` |
| CORS | Restricted to `FRONTEND_URL` in production |
| Rate limiting | Apply rate limiting on `POST /auth/login` (e.g., 10 attempts per 15 minutes per IP) |
| Cloudinary access | Server-side SDK only; no unsigned uploads |
| SQL injection | Prevented by Prisma ORM parameterized queries |
| Cookie security | `Secure`, `HttpOnly`, `SameSite=Strict` in production |
