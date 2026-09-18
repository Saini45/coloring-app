# Architecture Overview 🏗️

Complete technical breakdown of the coloring app platform.

## System Design

```
┌─────────────────────────────────────────────────────┐
│                    CUSTOMER                         │
└────────────────┬────────────────────────────────────┘
                 │
         ┌───────▼────────┐
         │   Next.js App  │
         │   (Frontend)   │
         └───────┬────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    │        ┌───▼───┐        │
    │        │API    │        │
    │        │Routes │        │
    │        └───┬───┘        │
    │            │            │
┌───▼──┐   ┌────▼─────┐  ┌───▼──┐
│Auth  │───│Stripe    │──│Email │
│Login │   │Payment   │  │Send  │
└──────┘   └────┬─────┘  └──────┘
                │
         ┌──────▼──────┐
         │ PostgreSQL  │
         │  Database   │
         └─────────────┘
```

## Request Flow for Customer Purchase

```
1. Customer browses products
   └─> GET /api/products
   └─> Database query returns product list

2. Customer views product details
   └─> GET /api/products/[slug]
   └─> Display preview pages, price, details

3. Customer adds to cart
   └─> Stored in browser (localStorage/Zustand)

4. Customer proceeds to checkout
   └─> POST /api/orders
   └─> Creates order record in database
   └─> Generates Stripe payment intent
   └─> Returns client secret

5. Customer completes payment
   └─> Stripe processes payment
   └─> Sends webhook to /api/webhooks/stripe
   └─> ✓ CRITICAL: Server-side verification
   └─> Updates order status to "paid"
   └─> Creates download_access records

6. Customer receives download link
   └─> Email sent via SendGrid
   └─> Download link uses secure token
   └─> GET /api/downloads/[token]
   └─> Verifies token validity
   └─> Returns signed S3 URL (or local file path)

7. Customer downloads PDF
   └─> Browser downloads file
   └─> Download count incremented
   └─> Customer can re-download for 30 days
```

## Request Flow for Admin Operations

```
1. Admin logs in
   └─> POST /api/admin/login
   └─> Username + password verified
   └─> JWT token created
   └─> Token stored in cookie/localStorage

2. Admin adds product
   └─> POST /api/admin/products
   └─> Verifies JWT token
   └─> Uploads cover image to S3/local
   └─> Uploads preview images to S3/local
   └─> Uploads PDF to S3/local
   └─> Creates product record in database

3. Admin views orders
   └─> GET /api/admin/orders
   └─> Returns all orders with details
   └─> Shows payment status, downloads

4. Admin manages products
   └─> GET /api/admin/products (list)
   └─> PUT /api/admin/products/[id] (update)
   └─> DELETE /api/admin/products/[id] (deactivate)
```

## Database Schema

### Products Table
Stores product information with flexibility for future extensions.

```sql
products {
  id                INT PRIMARY KEY
  name              VARCHAR(255)        -- "ABC Coloring Adventure"
  slug              VARCHAR(255)        -- "abc-coloring-adventure"
  description       TEXT                -- Short description
  long_description  TEXT                -- Full description
  category_id       INT -> categories   -- Physical books, digital, etc.
  theme_id          INT -> themes       -- Animals, dinosaurs, etc.
  min_age           INT                 -- Minimum age (3)
  max_age           INT                 -- Maximum age (6)
  page_count        INT                 -- Number of pages (20)
  price_cents       INT                 -- Price in paise (29900 = ₹299)
  sale_price_cents  INT                 -- Discounted price (optional)
  cover_image_url   VARCHAR(500)        -- S3 or local path
  preview_images    JSONB               -- Array of preview image URLs
  pdf_file_url      VARCHAR(500)        -- S3 or local path to PDF
  seo_title         VARCHAR(255)        -- For Google
  seo_description   VARCHAR(500)        -- For Google
  is_published      BOOLEAN             -- Show on website?
  is_featured       BOOLEAN             -- Show on homepage?
  product_type      VARCHAR(50)         -- "digital_pdf", "physical", "bundle"
  metadata          JSONB               -- Extensible JSON for future use
  created_at        TIMESTAMP
  updated_at        TIMESTAMP
}
```

### Orders Table
Tracks all customer purchases.

```sql
orders {
  id                      INT PRIMARY KEY
  order_number            VARCHAR(50)  -- "ORD-ABC123-DEF456" (unique)
  customer_name           VARCHAR(255) -- "John Doe"
  customer_email          VARCHAR(255) -- "john@example.com"
  total_cents             INT          -- 29900 (₹299)
  status                  VARCHAR(50)  -- "pending", "completed", "refunded"
  payment_status          VARCHAR(50)  -- "pending", "paid", "failed", "canceled"
  stripe_payment_intent_id VARCHAR(255) -- Stripe ID for tracking
  stripe_charge_id        VARCHAR(255) -- Stripe charge ID
  metadata                JSONB        -- Custom fields
  created_at              TIMESTAMP
  updated_at              TIMESTAMP
}
```

### Order Items Table
Stores products in each order.

```sql
order_items {
  id              INT PRIMARY KEY
  order_id        INT REFERENCES orders -- Which order?
  product_id      INT REFERENCES products
  product_name    VARCHAR(255)    -- Denormalized for history
  quantity        INT              -- Always 1 for PDFs (for future bundles)
  price_cents     INT              -- Price at time of purchase
  created_at      TIMESTAMP
}
```

### Download Access Table
**Critical for secure PDF delivery.**

Allows time-limited, trackable downloads without exposing PDF URLs.

```sql
download_access {
  id                INT PRIMARY KEY
  order_id          INT REFERENCES orders      -- Which order?
  product_id        INT REFERENCES products
  access_token      VARCHAR(255) UNIQUE        -- Cryptographically secure token
  is_expired        BOOLEAN                    -- Manually revoke?
  download_count    INT DEFAULT 0              -- Track usage
  last_downloaded_at TIMESTAMP                 -- When was it last used?
  expires_at        TIMESTAMP                  -- Expires after 30 days
  created_at        TIMESTAMP
}
```

Example flow:
1. Payment succeeds
2. `INSERT INTO download_access` creates row with random token
3. Email sent: "Click here to download: https://app.com/api/downloads/abc123def456..."
4. Customer clicks link
5. `GET /api/downloads/abc123def456` validates token, returns PDF
6. Download count incremented
7. After 30 days, token expires

### Authentication Tables
For admin panel security.

```sql
admin_users {
  id              INT PRIMARY KEY
  username        VARCHAR(100) UNIQUE  -- "admin"
  password_hash   VARCHAR(255)         -- bcryptjs hash
  email           VARCHAR(255)
  is_active       BOOLEAN
  last_login      TIMESTAMP
  created_at      TIMESTAMP
}
```

## Payment Processing (CRITICAL SECURITY)

### Why Payment Verification on Server Matters

❌ **INSECURE**: Browser decides payment succeeded
```javascript
// DON'T DO THIS
if (stripe.confirmPayment()) {
  giveUserDownloadAccess(); // Hacker can call this!
}
```

✅ **SECURE**: Server verifies via webhook
```javascript
// DO THIS
// 1. Stripe processes payment
// 2. Stripe sends webhook to server
// 3. Server verifies signature
// 4. Server checks payment intent status
// 5. ONLY THEN give download access
```

### Implementation Details

1. **Create Payment Intent**
   ```
   POST /api/orders
   {
     "items": [{ "product_id": 1, "quantity": 1 }],
     "customerEmail": "user@example.com",
     "customerName": "John Doe"
   }
   ```
   Returns: `clientSecret` for frontend + `paymentIntentId` for tracking

2. **Frontend Collects Payment**
   - Uses Stripe.js to securely collect card details
   - Confirms payment with clientSecret
   - Redirects to `/checkout/success`

3. **Server Webhook Verification**
   ```
   POST /api/webhooks/stripe (called by Stripe servers)
   {
     "type": "payment_intent.succeeded",
     "data": { ... }
   }
   ```
   - Verifies webhook signature (only Stripe knows secret)
   - Checks `payment_intent.status === "succeeded"`
   - Updates order: `status = "completed", payment_status = "paid"`
   - Creates download access tokens
   - Sends confirmation email

4. **Download Link Works Because:**
   - Order status is verified as "paid"
   - Download access record exists
   - Token is valid and not expired

## File Storage Architecture

### Option 1: Local Storage (Development)
```
Files stored in: public/uploads/
├── products/
│   ├── cover/
│   ├── preview/
│   └── pdfs/
```
- Simple setup
- No AWS credentials needed
- Good for local dev
- Not suitable for production (single server)

### Option 2: AWS S3 (Production)
```
S3 Bucket: coloring-app-bucket
├── products/
│   ├── cover/
│   │   └── abc-coloring-001.jpg
│   ├── preview/
│   │   └── abc-coloring-001-p1.jpg
│   └── pdfs/
│       └── abc-coloring-001.pdf
```
- Secure (private bucket)
- Signed URLs (time-limited access)
- Scalable to millions of downloads
- CDN integration (CloudFront)

Security model:
```
1. PDF uploaded to S3 (private bucket)
2. URL stored in database
3. Customer clicks download link
4. Server generates signed URL (valid 1 hour)
5. Customer downloads from S3 directly
6. Link expires, becomes unusable
```

## API Routes Reference

### Customer-Facing APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/products` | GET | List all products with filters |
| `/api/products/[slug]` | GET | Get product details |
| `/api/orders` | POST | Create order |
| `/api/orders` | GET | Retrieve order (by id or email) |
| `/api/downloads/[token]` | GET | Download PDF with secure token |

### Stripe Webhook

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/webhooks/stripe` | POST | Receive payment events from Stripe |

### Admin APIs

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/login` | POST | Admin authentication |
| `/api/admin/login` | GET | Initialize default admin |
| `/api/admin/products` | GET | List products (admin view) |
| `/api/admin/products` | POST | Create product |
| `/api/admin/products/[id]` | GET | Get product (admin view) |
| `/api/admin/products/[id]` | PUT | Update product |
| `/api/admin/products/[id]` | DELETE | Deactivate product |
| `/api/admin/orders` | GET | List all orders |
| `/api/admin/orders/[id]` | GET | Get order details |
| `/api/admin/dashboard` | GET | Analytics data |

## Component Architecture

### Pages (Rendered Server-Side)

```
app/
├── page.tsx                 # Homepage (hero, featured products)
├── shop/
│   ├── page.tsx             # Product catalog
│   └── [slug]/
│       └── page.tsx         # Product detail page
├── checkout/
│   ├── page.tsx             # Checkout page
│   ├── success/
│   │   └── page.tsx         # Order success page
│   └── failed/
│       └── page.tsx         # Payment failed page
├── admin/
│   ├── login/page.tsx       # Admin login
│   ├── dashboard/
│   │   └── page.tsx         # Admin dashboard
│   ├── products/
│   │   ├── page.tsx         # Product list (admin)
│   │   ├── new/page.tsx     # Add product
│   │   └── [id]/
│   │       └── page.tsx     # Edit product
│   └── orders/
│       ├── page.tsx         # Order list (admin)
│       └── [id]/
│           └── page.tsx     # Order detail
└── api/                     # API routes
```

### Reusable Components (Client-Side)

```
components/
├── Header.tsx               # Navigation
├── Footer.tsx               # Footer
├── ProductCard.tsx          # Product preview card
├── ShoppingCart.tsx         # Cart modal
├── CheckoutForm.tsx         # Stripe payment form
├── AdminProductForm.tsx     # Product creation/edit
└── ...
```

## Future-Proof Architecture

### Easy to Add Later

1. **Physical Products**
   - `product_type = "physical"` already in schema
   - Add `inventory` table
   - Add shipping address fields to orders
   - Add shipping cost calculation

2. **Bundles**
   - Create `bundles` table
   - Create `bundle_items` join table
   - Pricing rules for bundles
   - No frontend changes needed (same checkout)

3. **Subscriptions**
   - Add `subscriptions` table
   - Stripe subscription integration
   - Monthly email with new products

4. **Customer Accounts**
   - `customers` table with JWT auth
   - View past orders
   - Wishlist
   - Better email delivery

5. **Reviews & Ratings**
   - `product_reviews` table
   - Display ratings on product page
   - Send review email 7 days after purchase

6. **Coupons & Discounts**
   - `coupons` table
   - `coupon_codes` table
   - Apply during checkout
   - Promo email campaigns

All these can be added without changing the core architecture!

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...

# Stripe (Payment)
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_test_... or pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid (Email)
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=orders@...

# AWS S3 (File Storage - optional)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=...
AWS_S3_REGION=us-east-1
USE_LOCAL_STORAGE=true|false

# Admin Auth
JWT_SECRET=your-secret-key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Performance Optimization

### Image Optimization
- Next.js `Image` component with optimization
- WebP format conversion
- Responsive srcset generation
- Lazy loading

### Database Optimization
- Indexed columns for common queries
- Efficient filtering (age, theme, category)
- Query optimization in place

### Caching Strategies
- Static product pages (ISR)
- Browser cache headers
- Vercel edge cache

### Bundle Size
- Tree-shaking unused code
- Code splitting for admin
- Minimal dependencies

## Monitoring & Observability

### What to Monitor

1. **Stripe Payments**
   - Dashboard: https://dashboard.stripe.com
   - Check daily for failed payments
   - Review webhook delivery status

2. **Emails**
   - SendGrid Activity: https://app.sendgrid.com/activity
   - Monitor delivery rate
   - Check spam complaints

3. **Database**
   - Railway dashboard for storage/usage
   - Monitor slow queries
   - Track connection pool

4. **Application**
   - Vercel analytics
   - Error logs
   - Deployment history

---

**This architecture is:**
- ✅ Secure (server-side payment verification)
- ✅ Scalable (stateless frontend, managed database)
- ✅ Maintainable (clear separation of concerns)
- ✅ Extensible (easy to add features)
- ✅ Production-ready (implements best practices)
