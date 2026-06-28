# Database Schema Design

## Project

Bio NL Pharmaceuticals

## Version

2.0 — Updated to reflect all architectural decisions from Requirements Round 1.

---

# Design Principles

* PostgreSQL Database
* Prisma ORM
* Normalized Relational Design
* SEO-Friendly URLs using Slugs
* Data-Driven UI
* Future Scalability
* Multilingual Content Support (Arabic / English)
* Cloudinary for all media storage (no local file storage)

---

# Schema Change Log (v1.0 → v2.0)

| # | Entity | Change | Reason |
|---|--------|--------|--------|
| 1 | `Category` | Added `slug` (unique, auto-generated from nameEn) | Confirmed requirement. Enables SEO-friendly category filter URLs (e.g. `/products?category=derma`) and consistent API filtering by slug. |
| 2 | `Product` | Added `coverImagePublicId` | Cloudinary requires the `public_id` to delete an asset. Without it, the cover image cannot be removed from Cloudinary when a product is deleted or its cover is changed. Storing only the URL is insufficient. |
| 3 | `ProductImage` | Added `cloudinaryPublicId` | Same reason as above. Each gallery image uploaded via NestJS receives a `public_id` from Cloudinary. This must be persisted to enable proper deletion from the CDN. |
| 4 | `Order` | Added `paymentMethod` enum (`INSTAPAY`, `VODAFONE_CASH`) | Confirmed as a required field during checkout. Completely absent from the original schema. Critical for order management and future payment gateway integration. |
| 5 | `OrderItem` | Added `productId` (nullable FK to Product) | The snapshot pattern is correct and preserved. Retaining a soft nullable reference to the originating product is zero-cost now and enables future analytics without a schema migration. Set to `SET NULL` on product delete so historical orders are never broken. |
| 6 | `ContactMessage` | Added `isRead` (boolean, default false) | Without this field, admins have no way to distinguish new messages from already-reviewed ones. This is a single boolean — not a new feature — and costs nothing. Aligns with the "view only" requirement while improving admin usability. |

---

# Entity: Admin

Purpose:
Manage dashboard access. Admin accounts are seeded manually — no public registration.

Fields:

* `id` — UUID, primary key
* `email` — String, unique, required
* `passwordHash` — String, required (bcrypt hashed)
* `fullName` — String, required
* `createdAt` — DateTime, auto-set on creation
* `updatedAt` — DateTime, auto-updated

Auth Notes:

* JWT issued on login, stored in HttpOnly cookie.
* Token expiry: 24 hours.
* No refresh token in V1.
* All admins share the same permission level.
* No public registration endpoint exists.

---

# Entity: Product

Purpose:
Store pharmaceutical products sold by Bio NL Pharmaceuticals.

Fields:

* `id` — UUID, primary key
* `slug` — String, unique, auto-generated from `nameEn` on backend

Arabic Content:

* `nameAr` — String, required
* `descriptionAr` — String (long text), required
* `ingredientsAr` — String (long text), optional
* `usageInstructionsAr` — String (long text), optional

English Content:

* `nameEn` — String, required
* `descriptionEn` — String (long text), required
* `ingredientsEn` — String (long text), optional
* `usageInstructionsEn` — String (long text), optional

Pricing:

* `price` — Decimal (10, 2), required (displayed publicly in EGP)

Media:

* `coverImageUrl` — String, required (Cloudinary CDN URL)
* `coverImagePublicId` — String, required (Cloudinary public_id for deletion) ✦ NEW

Metadata:

* `createdAt` — DateTime, auto-set on creation
* `updatedAt` — DateTime, auto-updated

Relationships:

* One Product → Many ProductImages
* One Product → Many OrderItems
* One Product ↔ Many Categories (via ProductCategory)

Business Notes:

* Products are always considered available. No stock management in V1.
* Product prices are displayed publicly.
* Slug is generated from `nameEn` and must be unique. Collisions are resolved by appending a short unique numeric suffix.
* Deleting a product must also delete all associated images from Cloudinary (cover + gallery).

---

# Entity: ProductImage

Purpose:
Store additional gallery images for a product (beyond the cover image).

Fields:

* `id` — UUID, primary key
* `imageUrl` — String, required (Cloudinary CDN URL)
* `cloudinaryPublicId` — String, required (Cloudinary public_id for deletion) ✦ NEW
* `displayOrder` — Integer, required (controls gallery order, admin-managed)
* `createdAt` — DateTime, auto-set on creation

Relationships:

* Belongs To One Product (cascade delete on product deletion)

Notes:

* A product has one explicit cover image (stored on the Product entity itself).
* A product may have zero or more additional gallery images.
* `displayOrder` starts at 1 and is managed by the admin.

---

# Entity: Category

Purpose:
Store pharmaceutical product categories (e.g., Derma, Pedia, Dent, ENT).

Fields:

* `id` — UUID, primary key
* `slug` — String, unique, auto-generated from `nameEn` ✦ NEW
* `nameAr` — String, required
* `nameEn` — String, required
* `createdAt` — DateTime, auto-set on creation
* `updatedAt` — DateTime, auto-updated

Relationships:

* Many Categories ↔ Many Products (via ProductCategory)

Notes:

* Categories are dynamic and admin-managed. Never hardcoded.
* Slug enables SEO-friendly filtering: `/products?category=derma`.
* Deleting a category does not delete associated products; it removes the category link only.

---

# Entity: ProductCategory

Purpose:
Junction table for the many-to-many relationship between Products and Categories.

Fields:

* `productId` — UUID, FK → Product.id (cascade delete)
* `categoryId` — UUID, FK → Category.id (cascade delete)

Composite Primary Key: `(productId, categoryId)`

Notes:

* A product may belong to multiple categories.
* A category may contain multiple products.
* When a product is deleted, all its ProductCategory records are deleted.
* When a category is deleted, all its ProductCategory records are deleted (products are not deleted).

---

# Entity: Order

Purpose:
Store customer orders submitted through the public website.

Fields:

Customer Information:

* `id` — UUID, primary key
* `customerName` — String, required
* `phoneNumber` — String, required
* `email` — String, optional

Location:

* `governorate` — String, required
* `cityOrCenterOrVillage` — String, required
* `address` — String, required

Additional Information:

* `notes` — String (long text), optional

Payment:

* `paymentMethod` — Enum (`INSTAPAY`, `VODAFONE_CASH`), required ✦ NEW
* `subtotalAmount` — Decimal (10, 2), required (sum of all OrderItem.totalPrice values)

Metadata:

* `createdAt` — DateTime, auto-set on creation

Relationships:

* One Order → Many OrderItems
* One Order → Many PaymentProofs (at least one required per order)

Business Notes:

* Shipping cost is not calculated by the system. Customer is contacted later.
* No order status in V1. All orders are treated as received.
* Customers cannot cancel orders.
* At least one PaymentProof must be submitted with the order.
* n8n webhook is triggered on every new order submission.

Future Compatibility:

* `paymentMethod` enum can be extended to include `ONLINE_GATEWAY` when payment integration is added.
* An `orderStatus` field can be added in V2 without disrupting existing data.

---

# Entity: OrderItem

Purpose:
Store an individual product line within an order using a price snapshot pattern.

Fields:

* `id` — UUID, primary key

Product Snapshot (data frozen at order time):

* `productNameAr` — String, required
* `productNameEn` — String, required
* `unitPrice` — Decimal (10, 2), required (price at time of order)

Quantity:

* `quantity` — Integer, required (minimum: 1)

Line Total:

* `totalPrice` — Decimal (10, 2), required (unitPrice × quantity)

Soft Reference: ✦ UPDATED

* `productId` — UUID, nullable FK → Product.id (SET NULL on product delete)

Relationships:

* Belongs To One Order (cascade delete on order deletion)
* Soft reference to Product (nullable; does not affect historical data integrity)

Notes:

* Product name and price are snapshotted at order creation time.
* If a product's price or name changes later, historical orders remain accurate.
* The nullable `productId` soft reference is for future analytics use only.
  It does not affect any V1 business logic.

---

# Entity: PaymentProof

Purpose:
Store payment receipt screenshots uploaded by customers at order submission time.

Fields:

* `id` — UUID, primary key
* `imageUrl` — String, required (Cloudinary CDN URL)
* `uploadedAt` — DateTime, auto-set on creation

Relationships:

* Belongs To One Order (cascade delete on order deletion)

Notes:

* At least one PaymentProof is required per order.
* Multiple screenshots are allowed (e.g., split payments).
* Payment proofs are uploaded through the NestJS backend to Cloudinary.
* Cloudinary public_id is intentionally not stored for PaymentProofs in V1.
  Payment proofs are permanent records and should not be deleted.

---

# Entity: Offer

Purpose:
Store promotional campaigns and marketing content.

Fields:

* `id` — UUID, primary key

Arabic Content:

* `titleAr` — String, required
* `descriptionAr` — String (long text), optional

English Content:

* `titleEn` — String, required
* `descriptionEn` — String (long text), optional

Media:

* `imageUrl` — String, optional (Cloudinary CDN URL)

Display Options:

* `showInTopBanner` — Boolean, default: false

Duration:

* `startDate` — DateTime, required
* `endDate` — DateTime, required

Metadata:

* `createdAt` — DateTime, auto-set on creation
* `updatedAt` — DateTime, auto-updated

Business Notes:

* Offers are auto-active when the current date/time is between `startDate` and `endDate`.
* No manual isActive flag. Activation is entirely date-driven.
* Offers are marketing content only. No discount calculation or product linking in V1.
* Banner visibility is controlled through `showInTopBanner`.
* The public API filters for currently-active offers automatically.
* No slug in V1 (offers do not have detail pages).

---

# Entity: ContactMessage

Purpose:
Store customer inquiries submitted through the public contact form.

Fields:

* `id` — UUID, primary key

Customer Information:

* `fullName` — String, required
* `phoneNumber` — String, required
* `email` — String, optional

Message Content:

* `subject` — String, required
* `message` — String (long text), required

Status:

* `isRead` — Boolean, default: false ✦ NEW

Metadata:

* `createdAt` — DateTime, auto-set on creation

Business Notes:

* Messages are visible inside the Admin Dashboard only.
* Admin can only view messages (no reply or delete in V1).
* `isRead` allows the admin to mark messages as reviewed (improves inbox usability at zero cost).
* n8n webhook is triggered on every new contact message submission.

---

# Entity Relationships Summary

```
Admin
  └─ Independent Entity

Product
  ├─ Has Many ProductImages (cascade delete)
  ├─ Has Many OrderItems (soft reference, SET NULL on delete)
  └─ Belongs To Many Categories (via ProductCategory, cascade delete join records)

ProductImage
  └─ Belongs To Product

Category
  └─ Belongs To Many Products (via ProductCategory)

ProductCategory
  ├─ References Product
  └─ References Category

Order
  ├─ Has Many OrderItems (cascade delete)
  └─ Has Many PaymentProofs (cascade delete)

OrderItem
  ├─ Belongs To Order
  └─ Soft reference to Product (nullable)

PaymentProof
  └─ Belongs To Order

Offer
  └─ Independent Entity

ContactMessage
  └─ Independent Entity
```

---

# Enums

## PaymentMethod

```
INSTAPAY
VODAFONE_CASH
```

---

# Future Expansion Compatibility

The schema is intentionally designed to support future features without major redesign:

* **Discount Codes** — New `DiscountCode` entity + nullable `discountCodeId` on Order
* **Payment Gateways** — Extend `PaymentMethod` enum; add `transactionId` to Order
* **Order Status Tracking** — Add `orderStatus` enum field to Order
* **Blog System** — New `BlogPost` entity (independent)
* **Podcast / Video Section** — New `MediaContent` entity (independent)
* **Analytics Dashboard** — `productId` soft reference on OrderItem already enables basic analytics
* **Product Reviews** — New `Review` entity linked to Product
* **User Accounts** — New `User` entity; `Order.userId` nullable FK

No major schema restructuring is required to introduce these features.
