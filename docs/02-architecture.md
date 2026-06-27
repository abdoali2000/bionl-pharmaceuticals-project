# Architecture Document

## Project

Bio NL Pharmaceuticals

---

# Architecture Goals

The architecture should support:

* Scalability
* Maintainability
* Mobile-First Experience
* SEO Optimization
* Clean Code Principles
* Separation of Concerns
* AI-Assisted Development
* Future Feature Expansion

The project should remain easy to understand, extend, and maintain even as products, categories, and features grow over time.

---

# Architectural Principles

## 1. Mobile First

The website is expected to be used primarily on mobile devices.

All UI development should follow a Mobile-First approach:

* Design mobile screens first.
* Then adapt layouts for tablets.
* Finally enhance for desktop devices.

Performance on mobile devices takes priority over visual effects.

---

## 2. Separation of Concerns

Each layer of the application should have a single responsibility.

Examples:

Frontend:

* UI Components should only handle presentation.
* Services should handle API communication.
* Models should define data structures.

Backend:

* Controllers should handle HTTP requests.
* Services should contain business logic.
* Repositories/ORM should handle data access.

---

## 3. Feature-Based Architecture

The application should be organized by business features rather than technical types.

Example:

Frontend Features:

* Products
* Categories
* Orders
* Offers
* Contact
* Authentication

Backend Modules:

* Products
* Categories
* Orders
* Offers
* Contact
* Authentication

Each feature owns its related files.

---

## 4. Data-Driven UI

The frontend must not depend on hardcoded products or categories.

All UI should be generated from backend data.

When administrators create new products:

* Home page updates automatically.
* Product listing updates automatically.
* Search results update automatically.
* Product detail pages become available automatically.

No frontend code changes should be required.

---

## 5. Reusability

Reusable components should be preferred whenever possible.

Examples:

* Product Card
* Product Gallery
* Search Input
* Category Filter
* Offer Banner
* Form Controls

Avoid duplicate implementations.

---

## 6. Clean Code

Development should follow:

* Meaningful naming
* Small focused functions
* Single responsibility principle
* Minimal duplication
* Consistent project structure

Code readability is prioritized over clever solutions.

---

# Frontend Architecture

## Technology Stack

* Angular
* Angular SSR
* TypeScript
* SCSS

---

## Angular Strategy

Use:

* Standalone Components
* Signals
* Services

Avoid:

* NgRx
* Unnecessary complexity
* Over-engineering

---

## Frontend Folder Structure

frontend/src/app

* core/
* shared/
* features/
* layouts/

### Core

Application-wide services:

* Auth Service
* API Configuration
* Guards
* Interceptors

### Shared

Reusable components:

* Buttons
* Inputs
* Product Cards
* Modals
* Shared Models

### Features

Feature modules:

* products/
* categories/
* orders/
* offers/
* contact/
* auth/

Each feature contains:

* components
* pages
* services
* models
* routes

### Layouts

* Public Layout
* Admin Layout

---

# Backend Architecture

## Technology Stack

* NestJS
* TypeScript
* REST API

---

## Backend Strategy

Follow modular NestJS architecture.

Each business feature should exist as an independent module.

Example:

* Products Module
* Categories Module
* Orders Module
* Offers Module
* Contact Module
* Auth Module

---

## NestJS Structure

Each module should contain:

* Controller
* Service
* DTOs
* Entity/Model Definitions

Business logic should never be placed inside controllers.

---

# Database Architecture

## Database

PostgreSQL

---

## ORM

Prisma ORM

---

## Design Principles

* Normalized relational design
* Explicit relationships
* Consistent naming
* Future scalability

The schema should support future additions without major redesign.

Examples:

* Discount Codes
* Payment Gateways
* Video Content
* Blog System

---

# Authentication

## Admin Authentication

Use:

* JWT Authentication
* HttpOnly Cookies

No public registration system exists.

Only predefined administrator accounts can access the dashboard.

---

# File Storage Strategy

## Media Storage

Use Cloudinary for:

* Product Images
* Payment Proof Uploads

Reasons:

* CDN Delivery
* Automatic Optimization
* Scalability
* Reduced Server Load

Application servers should not store uploaded files directly.

---

# API Design

Use REST API.

Examples:

* GET /products
* GET /products/:slug
* POST /orders
* POST /admin/login

API responses should be predictable and consistent.

---

# SEO Strategy

Angular SSR is mandatory.

SEO requirements:

* Dynamic Meta Tags
* SEO-Friendly URLs
* Product Slugs
* Search Engine Indexability

Example:

/products/bio-hair-oil

Avoid numeric-only URLs whenever possible.

---

# Performance Strategy

Prioritize:

* Mobile Performance
* Optimized Images
* Lazy Loading
* Route-Level Code Splitting

Avoid heavy animations that negatively impact user experience.

---

# Testing Strategy

The system should support:

Frontend:

* Component Testing
* Form Validation Testing

Backend:

* Service Testing
* Controller Testing

Integration:

* API Testing
* Database Testing

Manual:

* Order Workflow Testing
* Admin Workflow Testing
* Mobile Responsiveness Testing

Testing should be included throughout development rather than postponed until project completion.

---

# Future Architecture Considerations

The architecture should remain compatible with future additions:

* Discount Codes
* Payment Gateway Integration
* Blog System
* Medical Articles
* Video/Podcast Section
* Analytics Dashboard
* Advanced Order Management

Future features should integrate without requiring major architectural changes.
