# 📄 Bio NL Pharmaceuticals — Final Requirements (Refined)

## 1. Project Overview
Bio NL Pharmaceuticals is a bilingual (Arabic/English) pharmaceutical catalog and ordering platform.
The system allows customers to browse products, view details, submit orders, and contact the company.

Admins can manage products, categories, offers, and customer interactions via a secure dashboard.
The system is SEO-friendly, SSR-ready, and fully data-driven.

## 2. Tech Expectations (High-Level)
* **Frontend:** Angular (SSR enabled)
* **Backend:** REST API (NestJS or equivalent)
* **Database:** PostgreSQL
* **ORM:** Prisma (recommended)
* **File Storage:** Cloud-based (e.g., Cloudinary)
* **Automation:** n8n Webhooks (for notifications)

## 3. Supported Languages
* **Arabic:** (Primary UI language)
* **English:** (Secondary UI language)

All product-related content supports bilingual fields:
* Name (AR/EN)
* Description (AR/EN)
* Ingredients (AR/EN)
* Usage Instructions (AR/EN)

## 4. Product Structure
### Product Fields:
* `id`
* `name` (AR/EN)
* `description` (AR/EN)
* `ingredients` (AR/EN)
* `usage instructions` (AR/EN)
* `price` (single fixed price)
* `category` (single category per product)
* `images` (multiple images allowed)
* `slug` (SEO-friendly URL)

### Notes:
* Products are dynamic (admin-created).
* No limits on product expansion in future.
* Each product automatically appears across all website sections without frontend changes.