# Little Hands, Big Imagination 🎨

A complete, production-ready e-commerce platform for children's coloring books and activity worksheets.

## Features

✅ Beautiful, mobile-first homepage with hero section  
✅ Complete product catalog with filtering & search  
✅ Product detail pages with preview gallery  
✅ Shopping cart system  
✅ Secure checkout with Stripe integration  
✅ **Server-side payment verification** (critical security feature)  
✅ Secure PDF delivery with time-limited tokens  
✅ Transactional email confirmations  
✅ Admin dashboard for product management  
✅ Order management system  
✅ Basic analytics dashboard  
✅ Fully responsive design  
✅ SEO-optimized pages  
✅ Social media campaign tracking  

## Tech Stack

- **Frontend**: Next.js 14 (React + TypeScript)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **Payment**: Stripe
- **File Storage**: AWS S3 (with fallback to local storage)
- **Email**: SendGrid
- **Hosting**: Vercel (frontend) + Railway (database)
- **Authentication**: JWT tokens for admin panel

## Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── products/          # Product listing & details
│   │   ├── orders/            # Order creation & retrieval
│   │   ├── webhooks/stripe/   # Payment webhook handler
│   │   ├── downloads/         # Secure file delivery
│   │   └── admin/             # Admin operations
│   ├── page.tsx               # Homepage
│   ├── shop/                  # Shopping pages
│   ├── admin/                 # Admin dashboard
│   └── layout.tsx             # Root layout
├── components/                 # Reusable components
├── lib/
│   ├── db.js                  # Database connection
│   ├── auth.js                # Authentication utilities
│   ├── stripe.js              # Stripe integration
│   ├── downloads.js           # Download token management
│   └── email.js               # Email sending
├── scripts/
│   ├── schema.sql             # Database schema
│   ├── setup-db.js            # Database setup script
│   └── seed-db.js             # Seed sample data
├── public/                     # Static assets
└── .env.example               # Environment variables template
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL 12+ (local or cloud)
- Stripe account (https://stripe.com)
- SendGrid account (https://sendgrid.com)
- AWS account (optional, for S3 file storage)

### Local Development

1. **Clone and install dependencies**
   ```bash
   git clone <repository>
   cd coloring-app
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and fill in:
   - `DATABASE_URL`: PostgreSQL connection string
   - `STRIPE_SECRET_KEY`: From Stripe dashboard
   - `STRIPE_PUBLISHABLE_KEY`: From Stripe dashboard
   - `SENDGRID_API_KEY`: From SendGrid dashboard
   - `JWT_SECRET`: Any random string for admin authentication

3. **Set up database**
   ```bash
   node scripts/setup-db.js      # Create tables
   node scripts/seed-db.js       # Add sample products
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   Open http://localhost:3000

### Database Setup (if PostgreSQL isn't running)

**Option A: Local PostgreSQL**
```bash
# macOS with Homebrew
brew install postgresql
brew services start postgresql

# Create database
createdb coloring_app

# Update DATABASE_URL
DATABASE_URL="postgresql://localhost:5432/coloring_app"
```

**Option B: Cloud Database (Railway, Supabase, etc.)**
```bash
# Use provided connection string
DATABASE_URL="postgresql://user:password@host:port/database"
```

### Sample Products

The seed script creates 5 sample products:
1. ABC Coloring Adventure (₹299)
2. Dinosaur Coloring Adventure (₹349)
3. Cute Animals Coloring Book (₹299)
4. Vehicles Coloring Book (₹299)
5. Ocean Animals Coloring Book (₹349)

All marked as published and featured.

## Configuration

### Stripe Setup

1. Go to https://dashboard.stripe.com/apikeys
2. Copy Secret Key and Publishable Key
3. Add to `.env.local`:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

4. Create webhook endpoint:
   - Go to Webhooks: https://dashboard.stripe.com/webhooks
   - Click "Add an endpoint"
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`
   - Copy Webhook Secret to `STRIPE_WEBHOOK_SECRET`

### SendGrid Setup

1. Create SendGrid account: https://sendgrid.com
2. Create API key: https://app.sendgrid.com/settings/api_keys
3. Add to `.env.local`:
   ```
   SENDGRID_API_KEY=SG.xxx
   SENDGRID_FROM_EMAIL=orders@yourdomain.com
   ```

### AWS S3 Setup (Optional)

For production file storage:

1. Create AWS account and S3 bucket
2. Create IAM user with S3 access
3. Add to `.env.local`:
   ```
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   AWS_S3_BUCKET=coloring-app-bucket
   AWS_S3_REGION=us-east-1
   USE_LOCAL_STORAGE=false
   ```

For development, use local file storage:
```
USE_LOCAL_STORAGE=true
LOCAL_STORAGE_PATH=./public/uploads
```

## Admin Panel

### Accessing Admin

1. Navigate to `/admin/login`
2. Default credentials (change these!):
   - Username: `admin`
   - Password: `change-this-in-production`

### Adding Products

1. Go to `/admin/products`
2. Click "Add New Product"
3. Fill in details:
   - Product name, description
   - Age range, page count
   - Price (in rupees)
   - Category & theme
   - Cover image & preview pages
   - Final PDF file
   - SEO title & description

4. Upload images/PDF
5. Publish

**Note**: Products are only visible on the website when status is "Published"

### Managing Orders

1. Go to `/admin/orders`
2. View all orders with:
   - Customer name & email
   - Products purchased
   - Amount paid
   - Payment status
   - Download status

3. Click order to see details
4. Manual refunds: Mark as "refunded" and customer loses download access

## Key Security Features

### Payment Verification
- ✅ Payments verified on server, not browser
- ✅ Stripe webhook handler validates payment completion
- ✅ Download access only created after successful payment
- ✅ No exposed payment credentials to frontend

### File Protection
- ✅ PDFs not publicly accessible
- ✅ Secure token-based download links
- ✅ Time-limited access (30 days by default)
- ✅ Download tracking & revocation capability

### Admin Security
- ✅ JWT-based authentication
- ✅ Admin panel behind login
- ✅ Secure password hashing (bcrypt)
- ✅ CSRF protection

## Deployment

### Deploy to Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourname/coloring-app.git
   git push origin main
   ```

2. **Create Vercel project**
   - Go to https://vercel.com/new
   - Connect GitHub repository
   - Click "Deploy"

3. **Set environment variables**
   - Go to Vercel project settings
   - Add environment variables from `.env.local`
   - Redeploy

4. **Update Stripe webhook**
   - New URL: `https://yourdomain.vercel.app/api/webhooks/stripe`

### Database Deployment

**Option A: Railway (recommended)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init

# Deploy database
# (Railway guides through this)
```

**Option B: Supabase**
- Create account at https://supabase.com
- Create new project
- Run schema.sql in SQL editor
- Copy connection string to `DATABASE_URL`

**Option C: Render**
- Create account at https://render.com
- Create PostgreSQL database
- Copy connection string

### Update Production Environment

After deployment:
1. Update `NEXT_PUBLIC_APP_URL` in Vercel
2. Update Stripe webhook URL
3. Update SendGrid approved sender domain
4. Change admin credentials
5. Set strong `JWT_SECRET`

## Email Templates

Order confirmation emails are sent automatically with:
- Order number & date
- Purchased products & prices
- Secure download button
- Support contact information

Customize email template in `lib/email.js`

## SEO Optimization

Each product page includes:
- SEO-friendly title & description
- Open Graph metadata for social sharing
- Structured product schema
- Sitemap generation
- Robots.txt

### Add to Google Search Console
1. Go to https://search.google.com/search-console
2. Add your domain
3. Submit sitemap: `/sitemap.xml`

## Future Enhancements

The architecture supports these future additions without major changes:

- **Physical products**: Product type system ready
- **Bundles**: Bundle support in database schema
- **Subscriptions**: Can add subscription table
- **Affiliate program**: Tracking codes ready
- **Customer accounts**: Auth system prepared
- **Review system**: Reviews table easy to add
- **Email marketing**: SendGrid integration ready

## Maintenance

### Regular Tasks

**Weekly**:
- Monitor Stripe dashboard
- Check email delivery

**Monthly**:
- Review order analytics
- Check server logs
- Test payment flow

**Quarterly**:
- Update dependencies: `npm update`
- Security audit
- Database backup

### Common Issues

**Payment not processing**:
1. Check Stripe API keys
2. Verify webhook endpoint registered
3. Check Stripe event logs for errors
4. Ensure orders table exists

**Emails not sending**:
1. Verify SendGrid API key
2. Check SendGrid sender verification
3. Review SendGrid activity logs
4. Test with `curl -X POST http://localhost:3000/api/test-email`

**Downloads not working**:
1. Verify database connection
2. Check that PDFs are uploaded
3. Test token generation
4. Review download_access table

## Support & Questions

For questions or issues:
1. Check the docs folder
2. Review API route comments
3. Check database schema

## License

© 2024 Little Hands, Big Imagination. All rights reserved.

---

**Remember**: Change all default credentials and secrets before going to production!
