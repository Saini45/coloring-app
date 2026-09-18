# Quick Start Guide 🚀

Get the app running locally in 5 minutes.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Database

### If you have PostgreSQL installed locally:

```bash
# Create database
createdb coloring_app

# Copy environment file
cp .env.example .env.local

# Edit .env.local and set:
DATABASE_URL="postgresql://localhost:5432/coloring_app"

# Create tables
node scripts/setup-db.js

# Add sample products
node scripts/seed-db.js
```

### If you don't have PostgreSQL:

**Option A: Use Docker** (easiest)
```bash
docker run --name postgres -e POSTGRES_DB=coloring_app -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15

# Copy .env.example to .env.local
cp .env.example .env.local

# Set in .env.local:
DATABASE_URL="postgresql://postgres:password@localhost:5432/coloring_app"

# Setup database
node scripts/setup-db.js
node scripts/seed-db.js
```

**Option B: Use Online Database**
- Sign up for free tier at:
  - Render: https://render.com (free PostgreSQL)
  - Supabase: https://supabase.com (free PostgreSQL)
  - Railway: https://railway.app (free PostgreSQL)

- Copy the connection string to `.env.local` as `DATABASE_URL`
- Run: `node scripts/setup-db.js && node scripts/seed-db.js`

## Step 3: Set Up Stripe (Optional for Testing)

For local testing without payments:
- Keep Stripe keys blank or use test keys from https://dashboard.stripe.com/test/apikeys
- Add to `.env.local`:
  ```
  STRIPE_SECRET_KEY=sk_test_yourtestkey
  STRIPE_PUBLISHABLE_KEY=pk_test_yourtestkey
  ```

The app will work without real payment processing in development mode.

## Step 4: Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## What You'll See

✅ Beautiful homepage with featured products  
✅ Product catalog (5 sample products already loaded)  
✅ Functional shopping cart  
✅ Checkout page  
✅ Admin panel at `/admin/login`  

## Admin Login

**URL**: http://localhost:3000/admin  
**Username**: `admin`  
**Password**: `change-this-in-production`

In admin panel you can:
- View products
- Add new products
- View orders
- Manage download access

## Test Checkout (with Stripe)

1. Add products to cart
2. Go to checkout
3. Use Stripe test card: `4242 4242 4242 4242`
4. Any future date
5. Any CVC

After successful payment:
- Order is marked as "paid"
- Download access is created
- Confirmation email would be sent (if SendGrid configured)

## File Structure

```
coloring-app/
├── app/
│   ├── page.tsx              ← Homepage
│   ├── api/                  ← Backend API
│   ├── shop/                 ← Shopping pages
│   └── admin/                ← Admin panel
├── components/               ← Reusable React components
├── lib/                      ← Utilities (db, stripe, email, etc.)
├── scripts/                  ← Database setup & seed scripts
└── public/                   ← Static files & uploads
```

## Common Commands

```bash
npm run dev              # Start development
npm run build            # Build for production
npm run start            # Run production build
npm run lint             # Check code quality

# Database
node scripts/setup-db.js # Initialize database
node scripts/seed-db.js  # Add sample data
```

## Troubleshooting

**Port 3000 already in use?**
```bash
npm run dev -- -p 3001
```

**Database connection error?**
- Check `DATABASE_URL` is correct
- Verify PostgreSQL is running
- Try: `psql $DATABASE_URL -c "SELECT 1"`

**Can't install dependencies?**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Stripe errors?**
- For local dev, leave Stripe keys blank
- Keys only needed for actual payments
- Test cards won't work without valid keys

## Next Steps

1. **Customize brand**
   - Edit colors in `app/globals.css`
   - Update site title in `app/layout.tsx`
   - Change logo in components

2. **Add real products**
   - Go to `/admin`
   - Create product
   - Upload PDF & images
   - Publish

3. **Deploy to production**
   - Follow deployment section in README.md
   - Push to GitHub
   - Deploy with Vercel

## Questions?

- Check `README.md` for detailed docs
- Look at component comments for code explanations
- Database schema is in `scripts/schema.sql`
- API routes have detailed comments

---

**You're all set!** 🎉

The complete, working application is ready to customize and deploy.
