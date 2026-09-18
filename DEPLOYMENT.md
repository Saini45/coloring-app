# Production Deployment Guide 🚀

Deploy to production step-by-step.

## Choose Your Hosting

### Recommended: Vercel + Railway

- **Frontend**: Vercel (fastest, easiest)
- **Database**: Railway (simple PostgreSQL)
- **Total cost**: $0-10/month for starting out

### Alternative Options

- **Frontend**: Netlify, GitHub Pages
- **Backend**: Railway, Render, Heroku (retired but similar platforms exist)
- **Database**: Supabase, AWS RDS, DigitalOcean

## Step 1: Prepare Your Code

### 1a. Add to Git

```bash
git init
git add .
git commit -m "Initial commit"
```

### 1b. Create GitHub Repository

1. Go to https://github.com/new
2. Create new repository (e.g., `coloring-app`)
3. Add remote:
   ```bash
   git remote add origin https://github.com/yourname/coloring-app.git
   git branch -M main
   git push -u origin main
   ```

### 1c. Change Admin Password

Edit `scripts/seed-db.js` before running in production:

```javascript
// Change from:
'admin'
'change-this-in-production'

// Change to:
'your-secure-username'
'your-very-secure-password'
```

Or update directly in database after deployment:
```bash
# Run after production database is set up
UPDATE admin_users SET password_hash = bcrypt('your-new-password') WHERE username = 'admin';
```

## Step 2: Set Up Database (Railway)

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create PostgreSQL Database**
   - Click "New Project" → "Provision PostgreSQL"
   - Wait for database to be ready

3. **Get Connection String**
   - Go to PostgreSQL plugin
   - Click "Connect" tab
   - Copy connection string (looks like: `postgresql://user:password@host:port/database`)
   - Save for later

4. **Run Setup Scripts**
   ```bash
   # Locally, with connection string
   DATABASE_URL="your-connection-string" node scripts/setup-db.js
   DATABASE_URL="your-connection-string" node scripts/seed-db.js
   ```

## Step 3: Deploy Frontend (Vercel)

1. **Go to Vercel**
   - Visit https://vercel.com/new
   - Click "Continue with GitHub"
   - Select your `coloring-app` repository

2. **Configure Project**
   - Framework: Next.js
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Installation Command: `npm install`

3. **Add Environment Variables**
   Click "Environment Variables" and add:

   ```
   DATABASE_URL=postgresql://...  (from Railway)
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   SENDGRID_API_KEY=SG...
   SENDGRID_FROM_EMAIL=orders@yourdomain.com
   JWT_SECRET=your-random-string
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   AWS_ACCESS_KEY_ID=(if using S3)
   AWS_SECRET_ACCESS_KEY=(if using S3)
   AWS_S3_BUCKET=(if using S3)
   USE_LOCAL_STORAGE=false (or true for local)
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get your production URL

## Step 4: Set Up Payments (Stripe)

1. **Switch to Live Mode**
   - Go to https://dashboard.stripe.com
   - Toggle to "Live" mode
   - Go to API Keys
   - Copy live Secret Key and Publishable Key

2. **Add Stripe Keys to Vercel**
   - Go to Vercel project settings
   - Add live Stripe keys to environment variables:
     ```
     STRIPE_SECRET_KEY=sk_live_...
     STRIPE_PUBLISHABLE_KEY=pk_live_...
     ```

3. **Create Webhook Endpoint**
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add an endpoint"
   - Endpoint URL: `https://yourdomain.vercel.app/api/webhooks/stripe`
   - Events to listen to:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `payment_intent.canceled`
   - Click "Add endpoint"
   - Copy webhook secret (Signing secret)
   - Add to Vercel:
     ```
     STRIPE_WEBHOOK_SECRET=whsec_...
     ```

4. **Redeploy on Vercel**
   - Go to Vercel deployments
   - Click "Redeploy" on latest deployment

## Step 5: Set Up Email (SendGrid)

1. **Create SendGrid Account**
   - Go to https://sendgrid.com
   - Sign up (free tier available)

2. **Create API Key**
   - Go to https://app.sendgrid.com/settings/api_keys
   - Click "Create API Key"
   - Give it a name: `coloring-app`
   - Copy the key

3. **Verify Sender Email**
   - Go to https://app.sendgrid.com/settings/sender_auth
   - Click "Create New Sender"
   - Use: `orders@yourdomain.com` (if you own domain)
   - Or use default SendGrid email for testing

4. **Add to Vercel**
   ```
   SENDGRID_API_KEY=SG...
   SENDGRID_FROM_EMAIL=orders@yourdomain.com
   ```

## Step 6: Custom Domain (Optional)

### Add Domain to Vercel

1. Go to Vercel project settings
2. Click "Domains"
3. Enter your domain
4. Follow DNS instructions for your domain registrar
5. Wait for DNS to propagate (can take 24 hours)

### Update Stripe Webhook

After domain is live:
1. Go to https://dashboard.stripe.com/webhooks
2. Update webhook endpoint URL:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```

## Step 7: Test in Production

1. **Visit Your Site**
   ```
   https://yourdomain.com
   ```

2. **Test Admin Login**
   ```
   https://yourdomain.com/admin
   ```

3. **Test Product Purchase**
   - Add product to cart
   - Checkout
   - Use real Stripe test card: `4242 4242 4242 4242`
   - Check order in `/admin/orders`
   - Verify download link works

4. **Check Emails**
   - Verify order confirmation sent
   - Check SendGrid dashboard for delivery status

## Step 8: Production Checklist

### Security
- [ ] Change admin password
- [ ] Use live Stripe keys (not test keys)
- [ ] Set strong JWT_SECRET
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Remove sensitive data from code
- [ ] Update CORS if needed

### Performance
- [ ] Test homepage load time
- [ ] Test product page load time
- [ ] Test checkout speed
- [ ] Monitor Vercel analytics

### Functionality
- [ ] Homepage displays correctly
- [ ] Products visible and filterable
- [ ] Shopping cart works
- [ ] Checkout with real payment works
- [ ] Order confirmation email sent
- [ ] Download link works
- [ ] Admin panel accessible

### Monitoring
- [ ] Monitor Stripe for failed payments
- [ ] Monitor SendGrid for email failures
- [ ] Check Vercel error logs
- [ ] Check database usage

## Common Issues

### Payment webhook not firing?

1. Check Stripe webhook status:
   https://dashboard.stripe.com/webhooks
2. Look for failed deliveries
3. Verify endpoint URL is correct
4. Check Vercel logs for errors
5. Ensure `STRIPE_WEBHOOK_SECRET` is set

### Emails not sending?

1. Check SendGrid API key
2. Verify sender email is validated
3. Check SendGrid activity logs
4. Test email from `/admin`
5. Check spam folder

### Database connection failing?

1. Verify `DATABASE_URL` is correct
2. Check Railway database status
3. Verify IP whitelist (if applicable)
4. Test connection locally:
   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

### Admin login not working?

1. Verify database has admin user:
   ```bash
   DATABASE_URL="your-connection-string" node scripts/setup-db.js
   ```
2. Check JWT_SECRET is set
3. Clear browser cookies and try again

## Monitoring & Maintenance

### Weekly
- Check Stripe dashboard for failed payments
- Review SendGrid delivery stats
- Monitor Vercel analytics

### Monthly
- Review order analytics
- Check server logs for errors
- Test full checkout flow
- Backup database (Railway does this automatically)

### Security Updates
- Keep dependencies updated: `npm update`
- Monitor npm security advisories
- Update Node.js when new LTS releases

## Scaling

When you reach:

**100+ orders/month**:
- Consider CDN for images (Cloudflare)
- Monitor database performance
- Consider caching (Vercel edge cache)

**1000+ orders/month**:
- Upgrade Railway plan
- Add Redis cache
- Consider separate backend server

**10000+ orders/month**:
- Migrate to dedicated infrastructure
- Consider AWS, Google Cloud, or DigitalOcean
- Implement advanced caching strategies

## Support & Questions

- **Vercel Docs**: https://vercel.com/docs
- **Railway Docs**: https://docs.railway.app
- **Stripe Docs**: https://stripe.com/docs
- **SendGrid Docs**: https://docs.sendgrid.com

---

**You're live!** 🎉

Congratulations on launching your product.
