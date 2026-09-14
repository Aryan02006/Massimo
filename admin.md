# Massimo Restaurant — Admin Panel Comprehensive Technical & Architectural Documentation

> **Document Type:** System Architecture, Feature Specification & Engineering Reference  
> **Target Audience:** Engineering Team, Product Managers, Technical Evaluators, Academic & Industry Report Writers  
> **System Name:** Massimo Restaurant Management & Admin System  
> **Stack:** Next.js 16 (App Router), React 19, TypeScript, MongoDB, Tailwind CSS v4  

---

## Table of Contents

1. [Executive Summary & System Vision](#1-executive-summary--system-vision)
2. [Architectural Overview & Tech Stack](#2-architectural-overview--tech-stack)
3. [Security Architecture & Multi-Tier Authentication](#3-security-architecture--multi-tier-authentication)
4. [Database Architecture & Data Schemas](#4-database-architecture--data-schemas)
5. [Core Functional Modules & Features](#5-core-functional-modules--features)
   - [5.1 Dashboard & Business Intelligence](#51-dashboard--business-intelligence)
   - [5.2 Product & Menu Catalog Management](#52-product--menu-catalog-management)
   - [5.3 Order Lifecycle & Fulfillment Pipeline](#53-order-lifecycle--fulfillment-pipeline)
   - [5.4 Category & Menu Structure](#54-category--menu-structure)
   - [5.5 Coupon & Promotional Discount Integration](#55-coupon--promotional-discount-integration)
6. [API Architecture & Endpoint Reference](#6-api-architecture--endpoint-reference)
7. [Frontend Engineering & UI/UX Design System](#7-frontend-engineering--uiux-design-system)
8. [Edge Middleware & Request Interception Pipeline](#8-edge-middleware--request-interception-pipeline)
9. [Operational Workflows & State Machines](#9-operational-workflows--state-machines)
10. [Error Handling, Resilience & Performance Optimizations](#10-error-handling-resilience--performance-optimizations)
11. [Future Roadmap & Advanced Extensions](#11-future-roadmap--advanced-extensions)
12. [Summary Table & Implementation Matrix](#12-summary-table--implementation-matrix)

---

## 1. Executive Summary & System Vision

The **Massimo Admin Panel** is the mission-critical operational backbone of the Massimo Restaurant platform. Designed for high throughput, operational simplicity, and real-time oversight, it equips restaurant managers, kitchen operators, and administrators with end-to-end control over the restaurant's digital catalog, customer orders, fulfillment pipelines, and operational metrics.

### Key Objectives
* **Operational Control:** Real-time visibility and status orchestration over orders from confirmation to delivery.
* **Dynamic Menu Management:** Instantaneous product catalog updates, pricing, variant configuration (sizes, add-ons), and imagery without requiring code deployments.
* **Multi-Layered Security:** Strict role segregation between public customers and store administrators backed by HTTP-only cryptographic session cookies and Edge middleware guards.
* **Responsive Command Center:** Streamlined UI/UX tailored for rapid desktop workflows and on-the-floor tablet/mobile operations.

---

## 2. Architectural Overview & Tech Stack

The system follows a modern full-stack serverless architecture powered by Next.js App Router and MongoDB Atlas.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT BROWSER                                 │
│      (Desktop Browser / POS Tablet / Mobile Kitchen Screen)                 │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP / HTTPS Requests
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     NEXT.JS EDGE MIDDLEWARE (middleware.ts)                 │
│  - Intercepts `/admin/*` routes                                             │
│  - Verifies `massimo-admin-auth` cookie existence & valid 24-char ObjectId │
│  - Redirects unauthorized traffic to `/login`                               │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ Authorized Request
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS 16 APP ROUTER LAYER                            │
│  ┌───────────────────────────────┐     ┌─────────────────────────────────┐  │
│  │     Client Pages & Layout     │     │     Admin API Route Handlers    │  │
│  │  - /admin/dashboard           │     │  - /api/admin/login             │  │
│  │  - /admin/products            │     │  - /api/admin/logout            │  │
│  │  - /admin/orders              │     │  - /api/admin/me                │  │
│  │  - AdminShell.tsx             │     │  - /api/admin/stats             │  │
│  │  - Toast & Modal UI           │     │  - /api/admin/products          │  │
│  │                               │     │  - /api/admin/orders            │  │
│  └───────────────┬───────────────┘     └────────────────┬────────────────┘  │
└──────────────────┼──────────────────────────────────────┼───────────────────┘
                   │ Client Fetch (JSON)                  │ Server Verification
                   └──────────────────────────────────────┤ (`verifyAdminAuth`)
                                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   PERSISTENCE LAYER (lib/mongodb.ts)                        │
│  - Singleton `MongoClient` with Connection Pooling                          │
│  - MongoDB Database: `Massimo`                                              │
│  - Collections: `admins`, `products`, `orders`, `categories`, `coupons`     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack Table

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js (App Router) | `16.3.1` | Hybrid Server/Client rendering, API routing, edge middleware |
| **Core Library** | React | `19.2.8` | Component model, state management, hooks |
| **Language** | TypeScript | `5.x` | Static typing, interface definitions, safety |
| **Database** | MongoDB Native Driver | `7.6.0` | Direct high-performance NoSQL operations & aggregation |
| **Styling** | Tailwind CSS | `v4` | Utility-first responsive design, modern design tokens |
| **Cryptography** | Bcrypt | `6.0.0` | Salted password hashing and authentication verification |
| **Icons & Media** | Next/Image + Heroicons SVG | Native | Optimized WebP images & lightweight scalable vector icons |

---

## 3. Security Architecture & Multi-Tier Authentication

The Admin Panel utilizes a **defense-in-depth security model** preventing unauthorized data access or privilege escalation.

```
       [ Client Request to /admin/* ]
                     │
                     ▼
       ┌───────────────────────────┐
       │   Tier 1: Edge Guard      │  ──▶ [No / Invalid Cookie] ──▶ Redirect to /login
       │     (middleware.ts)       │
       └─────────────┬─────────────┘
                     │ [Valid Cookie Format]
                     ▼
       ┌───────────────────────────┐
       │   Tier 2: UI Auth Hook    │  ──▶ [Verification Failed] ──▶ Clear state & Redirect
       │    (/api/admin/me)        │
       └─────────────┬─────────────┘
                     │ [Authenticated State]
                     ▼
       ┌───────────────────────────┐
       │   Tier 3: API Protection  │  ──▶ [No DB Record Match]  ──▶ Return 401 Unauthorized
       │    (verifyAdminAuth.ts)   │
       └─────────────┬─────────────┘
                     │ [Verified Admin]
                     ▼
       [ Execute Database Mutation / Query ]
```

### 3.1 Three-Tier Protection Pipeline

1. **Tier 1 — Edge Middleware (`middleware.ts`):**
   - Intercepts all paths matching `["/admin/:path*", "/admin"]`.
   - Inspects the incoming `massimo-admin-auth` cookie.
   - Validates that the cookie exists and has a valid 24-character hexadecimal ObjectId format.
   - Re-routes any unauthenticated user directly to `/login`.
   - Special rule: Redirects direct visits to `/admin/login` to the unified `/login` page.

2. **Tier 2 — Client-Side Auth Handshake (`components/admin/AdminShell.tsx`):**
   - On component mount, sends a credentialed handshake to `/api/admin/me`.
   - Renders a branded loading skeleton while session legitimacy is confirmed.
   - Automatically handles session expiration or cookie tampering by evicting to `/login`.

3. **Tier 3 — Server-Side Route Guard (`lib/adminAuth.ts`):**
   - Every administrative API endpoint (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) invokes `verifyAdminAuth(request)`.
   - Queries the MongoDB `admins` collection using `new ObjectId(cookie.value)` to ensure the admin identity actively exists in the database.
   - Returns structured JSON `{ success: false, message: "Unauthorized admin access" }` with HTTP status `401` upon failure.

### 3.2 Dual Role Unified Login Architecture

The application implements a smart unified login endpoint (`/api/login`):
* Allows both Administrators and Customers to authenticate via a single login interface.
* **Resolution Priority:**
  1. Checks `admins` collection first by matching `username` or `email` (case-insensitive) and verifying the bcrypt password hash. If matched, issues the `massimo-admin-auth` cookie and responds with `redirectTo: "/admin/dashboard"`.
  2. If not an admin, checks `users` collection. If matched, issues `massimo-auth` cookie and responds with `redirectTo: "/"`.
  3. Automatically purges conflicting cookies on login (e.g., clears customer cookie when logging in as admin).

### 3.3 Cookie Security Configuration

```typescript
response.cookies.set("massimo-admin-auth", admin._id.toString(), {
  httpOnly: true,        // Prevents XSS attacks from accessing session token via document.cookie
  secure: false,        // Set to true in production SSL environments
  sameSite: "lax",      // Protects against Cross-Site Request Forgery (CSRF)
  path: "/",            // Scope cookie across all application routes
  maxAge: 60 * 60 * 24 * 7, // 7-day persistent session lifespan
});
```

---

## 4. Database Architecture & Data Schemas

The admin subsystem interacts with five core collections in the `Massimo` MongoDB database.

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│             admins              │       │           categories            │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ _id: ObjectId                   │       │ _id: ObjectId                   │
│ username: string (unique)       │       │ slug: string (unique)           │
│ email: string (unique)          │       │ title: string                   │
│ password: string (bcrypt hash)  │       │ desc: string                    │
│ createdAt: Date                 │       │ img: string                     │
└─────────────────────────────────┘       │ color: string                   │
                                          └────────────────┬────────────────┘
                                                           │
                                                           │ catSlug references slug
                                                           ▼
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│             orders              │       │            products             │
├─────────────────────────────────┤       ├─────────────────────────────────┤
│ _id: ObjectId                   │       │ _id: ObjectId                   │
│ userId: ObjectId | null         │       │ title: string                   │
│ customer: {                     │       │ desc: string                    │
│   name, phone, address,         │       │ price: number                   │
│   city, pincode, notes          │       │ catSlug: string                 │
│ }                               │       │ img: string                     │
│ items: Array<{                  │       │ options: Array<{                │
│   id, title, price,             │       │   title: string,                │
│   quantity, option, img         │       │   additionalPrice: number       │
│ }>                              │       │ }>                              │
│ subtotal: number                │       │ isFeatured: boolean             │
│ delivery: number                │       │ createdAt: Date                 │
│ discount: number                │       │ updatedAt: Date                 │
│ coupon: { code, type, value }   │       └─────────────────────────────────┘
│ total: number                   │
│ status: string                  │
│ createdAt: Date                 │
│ updatedAt: Date                 │
└─────────────────────────────────┘
```

### Detailed Schema Specifications

#### 1. `admins` Collection
```typescript
interface AdminSchema {
  _id: ObjectId;
  username: string;          // Admin display and login username
  email?: string;            // Admin notification and fallback login email
  password: string;          // Bcrypt hashed password string ($2a$10$...)
  createdAt?: Date;          // Account creation timestamp
}
```

#### 2. `products` Collection
```typescript
interface ProductOption {
  title: string;             // e.g. "Small", "Medium (+₹100)", "Large (+₹200)"
  additionalPrice: number;   // Incremental charge added to base price
}

interface ProductSchema {
  _id: ObjectId;
  title: string;             // Product name (e.g., "Sicilian Truffle Pizza")
  desc: string;              // Ingredients and culinary description
  price: number;             // Base price in INR / currency units
  catSlug: string;           // Category foreign key: "pizzas" | "burgers" | "pastas"
  img: string;               // Static or remote URL (e.g., "/temporary/p1.png")
  options: ProductOption[];  // Size variants and customization modifiers
  isFeatured: boolean;       // Display in homepage hero carousel / featured section
  createdAt: Date;           // Product record creation date
  updatedAt?: Date;          // Last modification timestamp
}
```

#### 3. `orders` Collection
```typescript
interface OrderItem {
  id: string;                // Product ID reference
  title: string;             // Item name at time of purchase
  price: number;             // Calculated unit price including option surcharge
  quantity: number;          // Quantity purchased
  option?: string | null;    // Selected variant title (e.g. "Medium")
  img?: string | null;       // Thumbnail image URL
}

interface CustomerDetails {
  name: string;              // Recipient full name
  phone: string;             // Delivery contact number
  address: string;           // Street address and apartment/unit
  city: string;              // Delivery city
  pincode: string;           // Postal PIN code
  notes?: string;            // Special delivery or kitchen instructions
}

interface CouponApplied {
  code: string;              // e.g., "MASSIMO50"
  type: "flat" | "percent";  // Discount calculation method
  value: number;             // Discount figure (₹ value or percentage)
}

interface OrderSchema {
  _id: ObjectId;
  userId?: ObjectId | null;  // Reference to registered user (null for guest checkout)
  customer: CustomerDetails; // Shipping destination and contact
  items: OrderItem[];        // Itemized bill of ordered food items
  subtotal: number;          // Raw cart total before discounts & delivery fees
  delivery: number;          // Shipping charge (e.g., ₹0 for free delivery)
  discount: number;          // Computed monetary deduction from coupon
  coupon?: CouponApplied;    // Coupon metadata
  total: number;             // Final settlement amount: (subtotal + delivery - discount)
  status: "Confirmed" | "Preparing" | "Out for Delivery" | "Delivered" | "Cancelled";
  createdAt: Date;           // Timestamp when order was placed
  updatedAt?: Date;          // Timestamp of latest status transition
}
```

---

## 5. Core Functional Modules & Features

### 5.1 Dashboard & Business Intelligence (`/admin/dashboard`)

The dashboard is the central executive control center, aggregating real-time KPIs and recent transactional flow.

* **Metric Cards:**
  * **Total Orders:** Real-time count of all historic orders placed in the database.
  * **Active Products:** Real-time count of all live items in the menu catalog.
  * **Categories:** Total count of active menu classifications.
  * **Total Gross Revenue:** Cumulative sum of all completed transactions.
* **Recent Orders Table:** Quick overview of the 5-10 latest orders featuring customer name, items summary, monetary total, status badges, and direct links to the order manager.
* **Quick Action Controls:** Instant shortcuts to add a product, view incoming kitchen orders, or launch the live customer storefront in a new tab.

---

### 5.2 Product & Menu Catalog Management (`/admin/products`)

The Product Manager is an enterprise-grade catalog builder with dynamic form controls, view toggles, and live search.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             PRODUCTS MANAGER                                │
│                                                                             │
│  [ Search: "Spicy..." ] [ Filter: All / Pizzas / Burgers ] [ View: ▦ / ☰ ]  │
│                                                       [ + Add New Product ] │
├─────────────────────────────────────────────────────────────────────────────┤
│  GRID VIEW / TABLE VIEW TOGGLE:                                             │
│  ┌────────────────────────┐  ┌────────────────────────┐                     │
│  │ 🍕 Margherita Supreme  │  │ 🍔 Truffle Beast Burger│                     │
│  │ Category: Pizzas       │  │ Category: Burgers      │                     │
│  │ Price: ₹299.00         │  │ Price: ₹349.00         │                     │
│  │ Variants: S(+0), M(+50)│  │ [★ Featured Badge]     │                     │
│  │ [ ✏️ Edit ] [ 🗑️ Delete]│  │ [ ✏️ Edit ] [ 🗑️ Delete]│                     │
│  └────────────────────────┘  └────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Key Capabilities:
1. **Dual Display Modes:**
   - **Grid Mode:** Rich visual card presentation displaying food images, price chips, category pill tags, and variant badges.
   - **Table Mode:** Dense tabular layout built for rapid inventory audits with sorting columns.
2. **Instant Search & Filtering:**
   - Multi-field text filtering across Product Title, Description, and Category Slug.
   - Category filtering dropdown dynamically populated from the database.
3. **Product Creation & Modification Modal:**
   - **Title & Description:** Full input controls with character sanitization.
   - **Base Price & Category:** Numeric price input and dynamic category picker.
   - **Image Selection Suite:** Dual approach:
     - *Preset Image Gallery Picker:* One-click visual selector containing pre-loaded restaurant imagery (`/temporary/p1.png` to `/temporary/p21.jpg`).
     - *Custom URL Field:* Accepts remote CDN or static image paths with instant live image preview.
   - **Dynamic Variant / Option Builder:**
     - Add, edit, or remove multiple size options (e.g., Small, Medium, Large).
     - Assign granular `additionalPrice` surcharges per option.
   - **Featured Showcase Toggle:** Mark items with the `isFeatured` boolean flag to promote them on the customer landing page carousel.
4. **Safe Deletion Pipeline:**
   - Two-step confirmation modal with product title matching to eliminate accidental inventory drops.
5. **Real-Time Catalog Analytics Header:**
   - Displays Total Products, Total Categories, Featured Count, and Computed Average Menu Price.

---

### 5.3 Order Lifecycle & Fulfillment Pipeline (`/admin/orders`)

The Order Management module orchestrates the entire kitchen and delivery lifecycle.

```
                      ┌─────────────────────────────┐
                      │    1. Confirmed (Blue)      │
                      │  New incoming customer order│
                      └──────────────┬──────────────┘
                                     │ (Kitchen accepts)
                                     ▼
                      ┌─────────────────────────────┐
                      │    2. Preparing (Amber)     │
                      │  Order is in the kitchen    │
                      └──────────────┬──────────────┘
                                     │ (Dispatched to rider)
                                     ▼
                      ┌─────────────────────────────┐
                      │ 3. Out for Delivery (Purple)│
                      │  Rider en-route to customer │
                      └──────────────┬──────────────┘
                                     │ (Delivered successfully)
                                     ▼
                      ┌─────────────────────────────┐
                      │    4. Delivered (Green)     │
                      │  Order fulfilled & completed│
                      └─────────────────────────────┘

       * Note: Orders can transition to "Cancelled (Red)" from any pre-delivery stage.
```

#### Key Capabilities:
1. **Interactive Status Progression:**
   - Status dropdown selector per order card/row allowing one-click status transitions.
   - Color-coded status tokens with matching ring borders and pulsating status dots:
     - **Confirmed:** `bg-blue-50 text-blue-700 ring-blue-600/20`
     - **Preparing:** `bg-amber-50 text-amber-700 ring-amber-600/20`
     - **Out for Delivery:** `bg-purple-50 text-purple-700 ring-purple-600/20`
     - **Delivered:** `bg-emerald-50 text-emerald-700 ring-emerald-600/20`
     - **Cancelled:** `bg-red-50 text-red-700 ring-red-600/20`
2. **Comprehensive Order Detail Modal:**
   - **Customer Profile:** Recipient name, direct dial telephone button (`tel:link`), street address, city, postal pincode, and custom kitchen notes.
   - **Itemized Bill:** Line-by-line breakdown with item thumbnail, product title, chosen variant size, unit cost, and quantity multiplier.
   - **Financial Breakdown:** Subtotal + Delivery fee - Applied coupon deduction = Net payable total.
3. **Advanced Filtering & Order Search:**
   - Search across Customer Name, Phone Number, City, Address, or exact MongoDB ObjectId.
   - Status filter tabs displaying real-time counts per stage (e.g., `All (24)`, `Confirmed (3)`, `Preparing (5)`, etc.).
4. **Order Deletion Modal:**
   - Administrative ability to purge legacy or test orders with verification.

---

### 5.4 Category & Menu Structure

* Categories group products into intuitive menus: **Pizzas**, **Burgers**, **Pastas**, and seasonal specials.
* Category metadata includes `slug`, `title`, `desc`, `img`, and custom brand badge `color`.
* Synchronized dynamically with product creation forms to guarantee relational integrity.

---

### 5.5 Coupon & Promotional Discount Integration

* Admin order invoices track applied discount vouchers.
* Subtotal, percentage or flat rate calculations, and final settlement figures are recorded in the order document for bookkeeping and revenue reconciliation.

---

## 6. API Architecture & Endpoint Reference

All admin API endpoints are located under `/app/api/admin/*` and require an authenticated session.

### Endpoint Directory

```
API BASE: /api/admin/
├── /login    [POST]   - Direct admin credential authentication
├── /logout   [POST]   - Terminate admin session & invalidate cookies
├── /me       [GET]    - Session validation and admin identity query
├── /stats    [GET]    - KPI aggregated metrics and recent orders
├── /products [GET]    - List products with category/search filters
│             [POST]   - Insert new product record
│             [PUT]    - Update existing product record
│             [DELETE] - Remove product by ObjectId query param
└── /orders   [GET]    - List orders with status/search filters & stats
              [PATCH]  - Update order fulfillment status
              [DELETE] - Remove order by ObjectId query param
```

---

### Comprehensive API Specifications

#### 1. `POST /api/admin/login`
Authenticates administrative credentials and sets the session cookie.
* **Headers:** `Content-Type: application/json`
* **Request Body:**
  ```json
  {
    "username": "admin",
    "password": "SuperSecretPassword123"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Admin login successful",
    "admin": {
      "id": "664b58e2f819a820c78a1101",
      "username": "admin"
    }
  }
  ```
* **Cookie Set:** `massimo-admin-auth=<ObjectId>; HttpOnly; Path=/; Max-Age=604800`

---

#### 2. `GET /api/admin/stats`
Fetches aggregate high-level metrics for the dashboard view.
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "stats": {
      "totalOrders": 142,
      "totalProducts": 28,
      "totalCategories": 3
    },
    "recentOrders": [
      {
        "_id": "6732f9a12c8b74e8912d0012",
        "customer": { "name": "Aryan Sharma" },
        "items": [{ "title": "Sicilian Truffle Pizza", "quantity": 2 }],
        "total": 598,
        "status": "Preparing",
        "createdAt": "2026-09-14T09:45:00.000Z"
      }
    ]
  }
  ```

---

#### 3. `GET /api/admin/products`
Retrieves products catalog with optional search and category filters.
* **Query Parameters:**
  * `category` *(optional)*: Category slug (e.g. `pizzas`, `burgers`, or `all`)
  * `search` *(optional)*: Keyword matching title, description, or category
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "products": [
      {
        "_id": "662a8c17b5e4089c19ab56e1",
        "id": "662a8c17b5e4089c19ab56e1",
        "title": "Bella Napoli Margherita",
        "desc": "Fresh mozzarella, San Marzano tomatoes, fresh basil, and extra virgin olive oil.",
        "price": 249,
        "catSlug": "pizzas",
        "img": "/temporary/p1.png",
        "options": [
          { "title": "Small (10-inch)", "additionalPrice": 0 },
          { "title": "Medium (12-inch)", "additionalPrice": 80 },
          { "title": "Large (14-inch)", "additionalPrice": 150 }
        ],
        "isFeatured": true,
        "createdAt": "2026-08-01T10:00:00.000Z"
      }
    ],
    "categories": [
      {
        "_id": "662a8c17b5e4089c19ab56e0",
        "slug": "pizzas",
        "title": "Pizzas",
        "desc": "Authentic wood-fired Italian pizzas",
        "img": "/temporary/m1.png",
        "color": "white"
      }
    ],
    "stats": {
      "totalProducts": 28,
      "totalCategories": 3,
      "featuredCount": 6,
      "avgPrice": 289.50
    }
  }
  ```

---

#### 4. `POST /api/admin/products`
Creates a new menu item in the database.
* **Request Body:**
  ```json
  {
    "title": "Smoked BBQ Bacon Burger",
    "desc": "Double grilled patty, smoked bacon, cheddar, caramelized onions, BBQ glaze.",
    "price": 329,
    "catSlug": "burgers",
    "img": "/temporary/p4.png",
    "options": [
      { "title": "Single Patty", "additionalPrice": 0 },
      { "title": "Double Patty", "additionalPrice": 90 }
    ],
    "isFeatured": true
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Product created successfully",
    "productId": "6630f9a12c8b74e8912d8819",
    "product": { ... }
  }
  ```

---

#### 5. `PUT /api/admin/products`
Updates an existing product item.
* **Request Body:** Must include `_id` or `id` plus updated fields.
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Product updated successfully",
    "product": { ... }
  }
  ```

---

#### 6. `DELETE /api/admin/products?id=<ObjectId>`
Permanently deletes a product item.
* **Query Parameters:** `id` (24-character hexadecimal ObjectId)
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Product deleted successfully"
  }
  ```

---

#### 7. `GET /api/admin/orders`
Retrieves all customer orders with filtering and financial totals.
* **Query Parameters:**
  * `status` *(optional)*: `Confirmed` | `Preparing` | `Out for Delivery` | `Delivered` | `Cancelled` | `All`
  * `search` *(optional)*: Customer name, phone, address, or ObjectId
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "orders": [
      {
        "_id": "6732f9a12c8b74e8912d0012",
        "userId": "663b58e2f819a820c78a5542",
        "customer": {
          "name": "Ananya Patel",
          "phone": "+91 98765 43210",
          "address": "Flat 402, Sunshine Heights, MG Road",
          "city": "Mumbai",
          "pincode": "400001",
          "notes": "Please leave at security desk"
        },
        "items": [
          {
            "id": "662a8c17b5e4089c19ab56e1",
            "title": "Bella Napoli Margherita",
            "price": 329,
            "quantity": 1,
            "option": "Medium (12-inch)",
            "img": "/temporary/p1.png"
          }
        ],
        "subtotal": 329,
        "delivery": 0,
        "discount": 50,
        "coupon": { "code": "WELCOME50", "type": "flat", "value": 50 },
        "total": 279,
        "status": "Preparing",
        "createdAt": "2026-09-14T09:45:00.000Z"
      }
    ],
    "stats": {
      "total": 142,
      "confirmed": 12,
      "preparing": 8,
      "outForDelivery": 6,
      "delivered": 110,
      "cancelled": 6,
      "totalRevenue": 48920
    }
  }
  ```

---

#### 8. `PATCH /api/admin/orders`
Updates fulfillment status for an order.
* **Request Body:**
  ```json
  {
    "orderId": "6732f9a12c8b74e8912d0012",
    "status": "Out for Delivery"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Order status updated to Out for Delivery"
  }
  ```

---

#### 9. `DELETE /api/admin/orders?id=<ObjectId>`
Deletes an order record permanently.
* **Success Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Order deleted successfully"
  }
  ```

---

## 7. Frontend Engineering & UI/UX Design System

The Admin Panel interface is built on a custom design system engineered for usability, responsiveness, and visual polish.

### 7.1 Component Hierarchy & Layout Shell

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AdminShell.tsx (Layout Master)                         │
│                                                                             │
│ ┌──────────────────────┐ ┌────────────────────────────────────────────────┐ │
│ │ SIDEBAR NAVIGATION   │ │ TOPBAR HEADER                                  │ │
│ │                      │ │  [ ☰ Drawer ]  Page Title    [ Action Buttons ] │ │
│ │ - Massimo Logo       │ ├────────────────────────────────────────────────┤ │
│ │ - Dashboard Link     │ │                                                │ │
│ │ - Orders Link        │ │ MAIN CONTENT AREA                              │ │
│ │ - Products Link      │ │  - Statistics Cards Strip                      │ │
│ │ - Category Link      │ │  - Search & Filter Controls                    │ │
│ │ - Settings Link      │ │  - Data Views (Grid / Table)                   │ │
│ │ - Live Store Link ↗  │ │  - Modals (Create / Edit / View / Delete)      │ │
│ │                      │ │  - Toast Notification System                   │ │
│ │ [ Admin Profile ]    │ │                                                │ │
│ │ [ Logout Button ⎋ ]  │ │                                                │ │
│ └──────────────────────┘ └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 UI Design System Specifications

1. **Color Palette:**
   - **Brand Primary:** Massimo Red (`#ef4444`, `text-red-500`, `bg-red-500`)
   - **Backgrounds:** Off-white Neutral Canvas (`bg-gray-100`, cards in `bg-white`)
   - **Accents:** Soft red tints (`bg-red-50`, `border-red-100`, `hover:bg-red-100/60`)
   - **Text Hierarchy:** Charcoal headers (`text-gray-800`), Slate body (`text-gray-600`), Muted labels (`text-gray-400`)

2. **Typography & Layout Principles:**
   - Bold uppercase tracking for navigational items (`tracking-[0.15em]`, `font-bold`)
   - Rounded pill buttons (`rounded-full`) and modern card radii (`rounded-2xl`, `rounded-3xl`)
   - Subtle depth with low-spread box shadows (`shadow-sm`, `shadow-xs`)

3. **Micro-Interactions & Feedback:**
   - Smooth sidebar drawer animation with backdrop blur on mobile (`backdrop-blur-xs`, `transition-transform duration-300`).
   - Floating contextual Toast system automatically dismissing after 3,500ms.
   - Interactive hover transitions on table rows, cards, and modal backdrops.
   - Dedicated loading spinners for asynchronous actions (Saving, Deleting, Status Updates).

---

## 8. Edge Middleware & Request Interception Pipeline

Next.js Edge Middleware executes on the V8 edge runtime before reaching page renderers or API route handlers, guaranteeing zero-latency access control.

```typescript
// Location: /middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept all administrative paths
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    
    // Redirect direct visits to legacy admin login route
    if (pathname === "/admin/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const adminAuthCookie = request.cookies.get("massimo-admin-auth");

    // Enforce 24-character hexadecimal ObjectId format verification
    if (!adminAuthCookie?.value || adminAuthCookie.value.trim().length !== 24) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
```

---

## 9. Operational Workflows & State Machines

### 9.1 Product Lifecycle Workflow

```
[ Admin Opens Product Manager ]
             │
             ├──▶ [ Click "+ Add Product" ] ──▶ Open Modal ──▶ Input Details & Select Image
             │                                                         │
             │                                                         ▼
             │                                               [ Validate Form Fields ]
             │                                                         │
             │                                      ┌──────────────────┴──────────────────┐
             │                                      ▼                                     ▼
             │                               [ Validation Error ]                 [ Form Valid ]
             │                               Display Alert Toast            POST /api/admin/products
             │                                                                            │
             │                                                                            ▼
             │                                                                 [ Update State & Toast ]
             │
             ├──▶ [ Click "Edit" ] ──▶ Populate Form State ──▶ PUT /api/admin/products
             │
             └──▶ [ Click "Delete" ] ──▶ Open Safety Modal ──▶ DELETE /api/admin/products?id=...
```

### 9.2 Kitchen Order Fulfillment State Machine

```
   ┌────────────────────────────────────────────────────────────┐
   │                       STATE MACHINE                        │
   │                                                            │
   │   [ Confirmed ] ──▶ [ Preparing ] ──▶ [ Out for Delivery ] │
   │          │                 │                    │          │
   │          │                 │                    ▼          │
   │          │                 │              [ Delivered ]    │
   │          │                 │                    │          │
   │          ▼                 ▼                    ▼          │
   │   [ Cancelled ]     [ Cancelled ]         (Complete)       │
   └────────────────────────────────────────────────────────────┘
```

---

## 10. Error Handling, Resilience & Performance Optimizations

### 10.1 Database Connection Pooling
- Utilizes a global singleton cached `MongoClientPromise` in `lib/mongodb.ts` across hot-reloads and serverless invocations.
- Reuses existing TCP sockets to prevent MongoDB Atlas connection starvation under high load.

### 10.2 Robust Input Sanitization
- Form fields are trimmed and validated before database persistence.
- Numeric constraints guarantee prices cannot be negative or NaN.
- Option arrays are sanitized to remove blank titles and default non-numeric surcharges to `0`.

### 10.3 Graceful Degradation & Network Safety
- All network interactions (`fetch`) are wrapped in `try...catch` blocks with user-friendly toast error notifications.
- Delete operations require explicit confirmation modals, protecting against accidental taps on touchscreens.

---

## 11. Future Roadmap & Advanced Extensions

The Massimo Admin Panel is engineered with an extensible modular structure. The following features are planned for future iterative releases:

1. **Real-Time Push Notifications (WebSockets / Server-Sent Events):**
   - Instant kitchen alert chime and badge update when a customer places an order without requiring manual page refresh.
2. **Sales Analytics & Revenue Charts:**
   - Visual charts (Chart.js / Recharts) displaying daily, weekly, and monthly revenue trends, top-selling dishes, and peak ordering hours.
3. **Automated Receipt & Kitchen Order Ticket (KOT) Printing:**
   - One-click thermal printer integration for kitchen staff and rider delivery receipts.
4. **Inventory & Stock Management:**
   - Real-time stock counters with automatic "Sold Out" badges when ingredients run low.
5. **Role-Based Granular Permissions (RBAC):**
   - Hierarchical access: Super Admin (all features), Kitchen Manager (Orders only), Content Editor (Products only).
6. **Data Export Suite:**
   - Export order logs, revenue reports, and customer lists to CSV, Excel, or PDF formats.

---

## 12. Summary Table & Implementation Matrix

| Module / Layer | File Path | Primary Responsibilities |
| :--- | :--- | :--- |
| **Edge Guard** | `middleware.ts` | Intercepts unauthenticated `/admin/*` requests, redirects to `/login`. |
| **Server Auth** | `lib/adminAuth.ts` | Authenticates session cookie against MongoDB `admins` collection. |
| **DB Client** | `lib/mongodb.ts` | Singleton MongoDB client promise with connection pooling. |
| **Admin Layout** | `components/admin/AdminShell.tsx` | Responsive sidebar, topbar, auth handshake, active route links, logout. |
| **Admin Dashboard** | `app/admin/dashboard/page.tsx` | KPI metric cards, recent orders snapshot, live store shortcuts. |
| **Product Manager** | `app/admin/products/page.tsx` | Grid/Table catalog views, Add/Edit/Delete modals, preset image picker. |
| **Order Manager** | `app/admin/orders/page.tsx` | Status pipeline orchestration, order inspection modal, customer data. |
| **Admin Stats API** | `app/api/admin/stats/route.ts` | Aggregates order count, product count, category count, recent orders. |
| **Admin Products API**| `app/api/admin/products/route.ts` | Full CRUD handlers with filter/search queries and pricing stats. |
| **Admin Orders API** | `app/api/admin/orders/route.ts` | GET filtered orders, PATCH status transitions, DELETE order records. |
| **Admin Auth APIs** | `app/api/admin/login/route.ts`<br>`app/api/admin/logout/route.ts`<br>`app/api/admin/me/route.ts` | Admin authentication, session destruction, and identity verification. |
| **Unified Login** | `app/api/login/route.ts` | Dual-role router resolving admin vs customer accounts with role redirect. |

---

*Document compiled and verified for the Massimo Restaurant Management System.*
