import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import pool from '@/lib/db';
import './shop.css';

export const dynamic = 'force-dynamic';

const AGE_FILTERS = [
  { label: 'Ages 3–4', value: '3-4' },
  { label: 'Ages 4–5', value: '4-5' },
  { label: 'Ages 5–6', value: '5-6' },
];

const THEME_EMOJI: Record<string, string> = {
  'abc-letters': '🔤',
  numbers: '🔢',
  animals: '🐾',
  dinosaurs: '🦕',
  vehicles: '🚗',
  space: '🚀',
  ocean: '🌊',
  farm: '🚜',
  nature: '🌲',
  jungle: '🌴',
};

function formatPrice(cents: number) {
  return `₹${(cents / 100).toFixed(0)}`;
}

async function getThemes() {
  const result = await pool.query(
    'SELECT id, name, slug FROM themes ORDER BY name ASC'
  );
  return result.rows;
}

async function getProducts(searchParams: Record<string, string | undefined>) {
  const conditions: string[] = ['p.is_published = true'];
  const values: any[] = [];

  if (searchParams.age) {
    const [minAge, maxAge] = searchParams.age.split('-').map(Number);
    if (!Number.isNaN(minAge) && !Number.isNaN(maxAge)) {
      values.push(maxAge);
      conditions.push(`p.min_age <= $${values.length}`);
      values.push(minAge);
      conditions.push(`p.max_age >= $${values.length}`);
    }
  }

  if (searchParams.theme) {
    values.push(searchParams.theme);
    conditions.push(`t.slug = $${values.length}`);
  }

  if (searchParams.search) {
    values.push(`%${searchParams.search}%`);
    conditions.push(
      `(p.name ILIKE $${values.length} OR p.description ILIKE $${values.length})`
    );
  }

  let orderBy = 'p.created_at DESC';
  if (searchParams.sort === 'price-low') orderBy = 'COALESCE(p.sale_price_cents, p.price_cents) ASC';
  if (searchParams.sort === 'price-high') orderBy = 'COALESCE(p.sale_price_cents, p.price_cents) DESC';
  if (searchParams.sort === 'name') orderBy = 'p.name ASC';

  const result = await pool.query(
    `SELECT p.id, p.name, p.slug, p.description, p.min_age, p.max_age,
            p.page_count, p.price_cents, p.sale_price_cents, p.cover_image_url,
            t.name AS theme_name, t.slug AS theme_slug
     FROM products p
     LEFT JOIN themes t ON p.theme_id = t.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY ${orderBy}
     LIMIT 200`,
    values
  );

  return result.rows;
}

function buildQuery(
  current: Record<string, string | undefined>,
  changes: Record<string, string | undefined>
) {
  const params = new URLSearchParams();
  const merged = { ...current, ...changes };
  Object.entries(merged).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const qs = params.toString();
  return qs ? `/shop?${qs}` : '/shop';
}

export const metadata = {
  title: 'Shop Coloring Books & Activities | RangPankh',
  description:
    'Browse printable coloring books and activity worksheets for children ages 3 to 6. Instant digital download.',
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const [products, themes] = await Promise.all([
    getProducts(searchParams),
    getThemes(),
  ]);

  const hasFilters = Boolean(
    searchParams.age || searchParams.theme || searchParams.search
  );

  return (
    <>
      <Header />

      <main className="shop-page">
        <div className="container">
          <div className="shop-header">
            <h1>All Activities</h1>
            <p>
              Printable coloring books and worksheets for little ones aged 3 to 6.
              Download instantly after purchase.
            </p>
          </div>

          <form className="shop-search" action="/shop" method="get">
            {searchParams.age && (
              <input type="hidden" name="age" value={searchParams.age} />
            )}
            {searchParams.theme && (
              <input type="hidden" name="theme" value={searchParams.theme} />
            )}
            <input
              type="search"
              name="search"
              placeholder="Search for dinosaurs, letters, animals…"
              defaultValue={searchParams.search || ''}
              aria-label="Search products"
            />
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>

          <div className="shop-filters">
            <div className="filter-group">
              <span className="filter-label">Age</span>
              <div className="filter-chips">
                <Link
                  href={buildQuery(searchParams, { age: undefined })}
                  className={`chip ${!searchParams.age ? 'chip-active' : ''}`}
                >
                  All ages
                </Link>
                {AGE_FILTERS.map((age) => (
                  <Link
                    key={age.value}
                    href={buildQuery(searchParams, { age: age.value })}
                    className={`chip ${
                      searchParams.age === age.value ? 'chip-active' : ''
                    }`}
                  >
                    {age.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="filter-label">Theme</span>
              <div className="filter-chips">
                <Link
                  href={buildQuery(searchParams, { theme: undefined })}
                  className={`chip ${!searchParams.theme ? 'chip-active' : ''}`}
                >
                  All themes
                </Link>
                {themes.map((theme: any) => (
                  <Link
                    key={theme.id}
                    href={buildQuery(searchParams, { theme: theme.slug })}
                    className={`chip ${
                      searchParams.theme === theme.slug ? 'chip-active' : ''
                    }`}
                  >
                    {THEME_EMOJI[theme.slug] || '🎨'} {theme.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="shop-meta">
            <p className="shop-count">
              {products.length} {products.length === 1 ? 'activity' : 'activities'}
              {hasFilters ? ' found' : ''}
            </p>
            {hasFilters && (
              <Link href="/shop" className="clear-filters">
                Clear filters
              </Link>
            )}
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-emoji">🔍</div>
              <h2>Nothing here just yet</h2>
              <p>
                We couldn&apos;t find anything matching that. Try a different age
                range or theme.
              </p>
              <Link href="/shop" className="btn btn-primary">
                Browse everything
              </Link>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product: any) => {
                const onSale =
                  product.sale_price_cents &&
                  product.sale_price_cents < product.price_cents;

                return (
                  <Link
                    key={product.id}
                    href={`/shop/${product.slug}`}
                    className="shop-card"
                  >
                    <div className="shop-card-image">
                      {product.cover_image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.cover_image_url}
                          alt={product.name}
                          loading="lazy"
                        />
                      ) : (
                        <span className="shop-card-emoji">
                          {THEME_EMOJI[product.theme_slug] || '🎨'}
                        </span>
                      )}
                      {onSale && <span className="sale-badge">Sale</span>}
                    </div>

                    <div className="shop-card-body">
                      <h2>{product.name}</h2>
                      <p className="shop-card-meta">
                        Ages {product.min_age}–{product.max_age}
                        {product.page_count ? ` · ${product.page_count} pages` : ''}
                      </p>
                      {product.description && (
                        <p className="shop-card-desc">{product.description}</p>
                      )}
                      <div className="shop-card-price">
                        {onSale ? (
                          <>
                            <span className="price-now">
                              {formatPrice(product.sale_price_cents)}
                            </span>
                            <span className="price-was">
                              {formatPrice(product.price_cents)}
                            </span>
                          </>
                        ) : (
                          <span className="price-now">
                            {formatPrice(product.price_cents)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
