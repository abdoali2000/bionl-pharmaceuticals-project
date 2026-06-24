# Bio NL Pharmaceuticals - Project Overview

## Project Summary

Bio NL Pharmaceuticals is a bilingual pharmaceutical products website designed to showcase company products, offers, company information, and customer ordering capabilities.

The platform will serve both customers and company administrators through a public website and an administration dashboard.

The website should be SEO-friendly, mobile responsive, and designed to support future business growth without requiring structural code changes.

---

## Supported Languages

* Arabic (Primary Language)
* English (Secondary Language)

All product-related content should support both Arabic and English versions.

Examples:

* Product Name (AR/EN)
* Product Description (AR/EN)
* Ingredients (AR/EN)
* Usage Instructions (AR/EN)

---

## Main Product Categories

Categories are dynamic and managed by administrators.

Initial categories:

* Derma
* Pedia
* Dent
* ENT

Administrators can create, update, and delete categories in the future.

---

## Public Website Pages

### Home Page

Contains:

* Hero Section
* Featured Products Section
* Promotional Offers Banner
* Product Categories Overview
* Company Highlights
* WhatsApp CTA
* Contact CTA

### Products Page

Contains:

* Product Listing
* Search by Product Name
* Filter by Category
* Filter by Price
* Product Cards

### Product Details Page

Dynamic route generated from product data.

Contains:

* Product Images Gallery
* Product Information
* Price
* Ingredients
* Usage Instructions
* Category
* Related Products

### About Us Page

Contains:

* Company Story
* Mission
* Vision
* Company Timeline
* Team Section

### Offers Page

Contains:

* Active Offers
* Seasonal Promotions
* Promotional Banner Content

### Contact Page

Contains:

* Contact Information
* Contact Form

---

## Order System

Customers can:

* Add Products to Cart
* Submit Orders
* Upload Payment Proof
* Use WhatsApp Ordering

Order Form Fields:

* Full Name
* Phone Number
* Governorate
* City / Center / Village
* Address
* Notes
* Discount Code (Future Feature)
* Payment Proof Upload

Shipping fees are not calculated by the website.

Customers are informed that shipping fees will be communicated later by company representatives.

---

## Payment Methods

Initial Version:

* InstaPay
* Vodafone Cash

Future Support:

* Online Payment Gateways

---

## Contact Messages

Visitors can submit messages through the Contact Form.

Messages are stored in the system and visible inside the Admin Dashboard.

---

## Admin Dashboard

Authentication required.

No public registration system.

Only predefined administrator accounts can access the dashboard.

Dashboard Modules:

### Products

* Create Product
* Update Product
* Delete Product
* Manage Product Images

### Categories

* Create Category
* Update Category
* Delete Category

### Offers

* Create Offer
* Update Offer
* Delete Offer

### Orders

* View Orders
* View Payment Proofs

### Contact Messages

* View Messages

---

## Offers System

Administrators can create promotional offers.

Offers may appear:

* On the Offers Page
* Inside the Promotional Banner above the Navigation Bar
* On the Home Page

---

## Content Architecture

The website must be fully data-driven.

Adding a new product through the Admin Dashboard should automatically make the product available throughout the entire website without requiring frontend code modifications.

Examples:

* Home Page
* Products Listing
* Search Results
* Category Pages
* Product Details Pages

All product-related UI should be generated from database content.

---

## Future Features

Not included in Version 1 but should be considered during architecture planning:

* Discount Codes
* Embedded YouTube Podcast Videos
* Blog / Medical Articles
* Online Payment Gateway Integration
* Product Analytics
* Advanced Reporting
