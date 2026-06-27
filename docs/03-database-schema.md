# Database Schema Design

## Project

Bio NL Pharmaceuticals

---

# Design Principles

* PostgreSQL Database
* Prisma ORM
* Normalized Relational Design
* SEO-Friendly URLs using Slugs
* Data-Driven UI
* Future Scalability
* Multilingual Content Support (Arabic / English)

---

# Entity: Admin

Purpose:
Manage dashboard access.

Fields:

* id
* email (unique)
* passwordHash
* fullName
* createdAt
* updatedAt

Notes:

* All admins have the same permissions.
* No public registration exists.
* Admin accounts are created manually.

---

# Entity: Product

Purpose:
Store pharmaceutical products.

Fields:

* id
* slug (unique)

Arabic Content:

* nameAr
* descriptionAr
* ingredientsAr
* usageInstructionsAr

English Content:

* nameEn
* descriptionEn
* ingredientsEn
* usageInstructionsEn

Pricing:

* price

Media:

* coverImageUrl

Metadata:

* createdAt
* updatedAt

Relationships:

* One Product → Many Product Images
* One Product → Many Order Items
* One Product ↔ Many Categories

Notes:

* Product prices are displayed publicly.
* Products are always considered available.
* No stock management exists in V1.

---

# Entity: ProductImage

Purpose:
Store additional product images.

Fields:

* id
* imageUrl
* displayOrder

Relationships:

* Belongs To One Product

Notes:

* A product has one cover image.
* A product may have multiple additional images.

---

# Entity: Category

Purpose:
Store medical categories.

Examples:

* Derma
* Pedia
* Dent
* ENT

Fields:

* id

Arabic:

* nameAr

English:

* nameEn

Metadata:

* createdAt
* updatedAt

Relationships:

* Many Categories ↔ Many Products

Notes:

* Admin can create new categories.
* Categories should not be hardcoded.

---

# Entity: ProductCategory

Purpose:
Many-to-Many relationship table.

Fields:

* productId
* categoryId

Relationships:

* Product ↔ Category

Notes:

* A product may belong to multiple categories.
* A category may contain multiple products.

---

# Entity: Order

Purpose:
Store customer orders.

Fields:

Customer Information:

* id
* customerName
* phoneNumber
* email (optional)

Location:

* governorate
* cityOrCenterOrVillage
* address

Additional Information:

* notes (optional)

Financial:

* subtotalAmount

Metadata:

* createdAt

Relationships:

* One Order → Many Order Items
* One Order → Many Payment Proofs

Notes:

* Shipping cost is not calculated by the system.
* Customer is contacted later regarding shipping.

---

# Entity: OrderItem

Purpose:
Store purchased products within an order.

Fields:

* id

Product Snapshot:

* productNameAr
* productNameEn

Pricing Snapshot:

* unitPrice

Quantity:

* quantity

Line Total:

* totalPrice

Relationships:

* Belongs To One Order
* References One Product

Notes:

* Product data is stored as a snapshot.
* Historical order data remains unchanged if product information changes later.

Example:

Product price today:
100 EGP

Product price next month:
150 EGP

Old order remains:
100 EGP

---

# Entity: PaymentProof

Purpose:
Store payment screenshots uploaded by customers.

Fields:

* id
* imageUrl
* uploadedAt

Relationships:

* Belongs To One Order

Notes:

* Multiple screenshots are allowed.

---

# Entity: Offer

Purpose:
Store promotional campaigns and marketing content.

Fields:

* id

Arabic Content:

* titleAr
* descriptionAr

English Content:

* titleEn
* descriptionEn

Media:

* imageUrl (optional)

Display Options:

* showInTopBanner

Duration:

* startDate
* endDate

Metadata:

* createdAt
* updatedAt

Notes:

* Offers may appear in:

  * Offers Page
  * Top Scrolling Banner
* Banner visibility is controlled through showInTopBanner.

---

# Entity: ContactMessage

Purpose:
Store customer inquiries and messages.

Fields:

* id

Customer Information:

* fullName
* phoneNumber
* email (optional)

Message Content:

* subject
* message

Metadata:

* createdAt

Notes:

* Messages are visible inside the Admin Dashboard.
* Messages are separate from orders.

---

# Entity Relationships Summary

Admin

* Independent Entity

Product

* Has Many ProductImages
* Has Many OrderItems
* Has Many Categories

ProductImage

* Belongs To Product

Category

* Has Many Products

ProductCategory

* Joins Products and Categories

Order

* Has Many OrderItems
* Has Many PaymentProofs

OrderItem

* Belongs To Order
* References Product

PaymentProof

* Belongs To Order

Offer

* Independent Entity

ContactMessage

* Independent Entity

---

# Future Expansion Compatibility

The schema is intentionally designed to support future features without major redesign:

* Discount Codes
* Payment Gateways
* Blog System
* Podcast / Video Section
* Analytics Dashboard
* Product Reviews
* Order Status Tracking
* User Accounts

No major schema restructuring should be required when introducing these features.
