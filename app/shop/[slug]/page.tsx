import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AddToCartButtons from '@/components/AddToCartButtons';
import PreviewGallery from '@/components/PreviewGallery';
import pool from '@/lib/db';
import './product.css';

export const dynamic = 'force-dynamic';

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

function parsePreviews(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === 'string');
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function getProduct(slug: string) {
  const result = await pool.query(
    `SELECT p.*, c.name AS category_name, t.name AS theme_name, t.slug AS theme_slug
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN themes t ON p.theme_id = t.id
     WHERE p.slug = $1 AND p.is_published = true`,
    [slug]
  );
  return result.rows[0] || null;
}

async function getRelated(product: any) {
  const result = await pool.query(
    `SELECT p.id, p.name, p.slug, p.min_age, p.max_age, p.price_cents,
            p.sale_price_cents, p.cover_image_url, t.slug AS theme_slug
     FROM products p
     LEFT JOIN themes t ON p.theme_id = t.id
     WHERE p.is_published = true
       AND p.id <> $1
       AND (p.theme_id = $2 OR p.min_age <= $3)
     ORDER BY (p.theme_id = $2) DESC, p.created_at DESC
     LIMIT 4`,
    [product.id, product.theme_id, product.max_age]
  );
  return result.rows;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);

  if (!product) {
    return { title: 'Product not found | RangPankh' };
  }

  const title = product.seo_title || `${product.name} | RangPankh`;
  const description =
    product.seo_description ||
    product.description ||
    `${product.name} — printable activity pages for ages ${product.min_age}–${product.max_age}.`;

  return {
    title,
    description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `/shop/${product.slug}`,
      images: product.cover_image_url ? [product.cover_image_url] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: product.cover_image_url ? [product.cover_image_url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  const related = await getRelated(product);
  const previews = parsePreviews(product.preview_images);
  const onSale =
    product.sale_price_cents && product.sale_price_cents < product.price_cents;
  const activePrice = onSale ? product.sale_price_cents : product.price_cents;
  const emoji = THEME_EMOJI[product.theme_slug] || '🎨';

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || undefined,
    image: product.cover_image_url || undefined,
    brand: { '@type': 'Brand', name: 'RangPankh' },
    offers: {
      '@type': 'Offer',
      price: (activePrice / 100).toFixed(2),
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      <Header />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <main className="product-page">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span>›</span>
            <Link href="/shop">Shop</Link>
            <span>›</span>
            <span className="breadcrumb-current">{product.name}</span>
          </nav>

          <div className="product-top">
            <div className="product-cover">
              {product.cover_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.cover_image_url} alt={product.name} />
              ) : (
                <span className="cover-emoji">{emoji}</span>
              )}
            </div>

            <div className="product-info">
              {product.theme_name && (
                <Link
                  href={`/shop?theme=${product.theme_slug}`}
                  className="theme-tag"
                >
                  {emoji} {product.theme_name}
                </Link>
              )}

              <h1>{product.name}</h1>

              <div className="product-facts">
                <span>Ages {product.min_age}–{product.max_age}</span>
                {product.page_count && <span>{product.page_count} pages</span>}
                <span>Instant PDF download</span>
              </div>

              {product.description && (
                <p className="product-lead">{product.description}</p>
              )}

              <div className="product-price">
                <span className="price-now">{formatPrice(activePrice)}</span>
                {onSale && (
                  <>
                    <span className="price-was">
                      {formatPrice(product.price_cents)}
                    </span>
                    <span className="price-save">
                      Save {formatPrice(product.price_cents - product.sale_price_cents)}
                    </span>
                  </>
                )}
              </div>

              <AddToCartButtons
                product={{
                  id: product.id,
                  slug: product.slug,
                  name: product.name,
                  price_cents: activePrice,
                  cover_image_url: product.cover_image_url,
                  theme_slug: product.theme_slug,
                }}
              />

              <ul className="trust-list">
                <li>✓ Download straight after payment</li>
                <li>✓ Print at home, as many times as you like</li>
                <li>✓ Link stays in your email for 30 days</li>
              </ul>
            </div>
          </div>

          <section className="product-section">
            <h2>A look inside</h2>
            <p className="section-lead">
              Real pages from the book, so you know exactly what your little one
              will be colouring.
            </p>
            <PreviewGallery
              images={previews}
              productName={product.name}
              pageCount={product.page_count}
            />
          </section>

          <section className="product-section whats-inside">
            <h2>What&apos;s inside</h2>
            <div className="inside-grid">
              <div className="inside-item">
                <span>📄</span>
                <h3>{product.page_count || 'Multiple'} pages</h3>
                <p>Ready to print on ordinary A4 paper.</p>
              </div>
              <div className="inside-item">
                <span>✏️</span>
                <h3>Big, simple outlines</h3>
                <p>Thick lines suited to small hands still learning control.</p>
              </div>
              <div className="inside-item">
                <span>👶</span>
                <h3>Ages {product.min_age}–{product.max_age}</h3>
                <p>Pitched at what children this age can actually manage.</p>
              </div>
              <div className="inside-item">
                <span>⚡</span>
                <h3>Instant access</h3>
                <p>No waiting, no delivery. Print it tonight.</p>
              </div>
            </div>

            {product.long_description && (
              <div className="long-description">
                <p>{product.long_description}</p>
              </div>
            )}
          </section>

          <section className="product-section">
            <h2>How it works</h2>
            <ol className="how-steps">
              <li>
                <strong>Buy the book.</strong> Pay securely by card or UPI.
              </li>
              <li>
                <strong>Download right away.</strong> The link appears the moment
                payment goes through.
              </li>
              <li>
                <strong>Print and colour.</strong> Print the whole book, or just
                the page your child wants today.
              </li>
            </ol>
          </section>

          {related.length > 0 && (
            <section className="product-section">
              <h2>You might also like</h2>
              <div className="related-grid">
                {related.map((item: any) => {
                  const itemSale =
                    item.sale_price_cents &&
                    item.sale_price_cents < item.price_cents;
                  return (
                    <Link
                      key={item.id}
                      href={`/shop/${item.slug}`}
                      className="related-card"
                    >
                      <div className="related-image">
                        {item.cover_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.cover_image_url}
                            alt={item.name}
                            loading="lazy"
                          />
                        ) : (
                          <span>{THEME_EMOJI[item.theme_slug] || '🎨'}</span>
                        )}
                      </div>
                      <h3>{item.name}</h3>
                      <p className="related-meta">
                        Ages {item.min_age}–{item.max_age}
                      </p>
                      <p className="related-price">
                        {formatPrice(
                          itemSale ? item.sale_price_cents : item.price_cents
                        )}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
