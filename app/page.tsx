import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import './home.css';

export default function Home() {
  return (
    <>
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">Little Hands.<br/>Big Imagination.</h1>
              <p className="hero-subtitle">Coloring and creative activities made for curious little minds.</p>
              <Link href="/shop" className="btn btn-primary btn-lg">
                Explore Activities
              </Link>
            </div>
            <div className="hero-image">
              <div className="placeholder-hero">🎨</div>
            </div>
          </div>
        </section>

        {/* Shop by Age */}
        <section className="section">
          <div className="container">
            <h2 className="section-title">Shop by Age</h2>
            <div className="grid grid-cols-3">
              <Link href="/shop?age=3-4" className="age-card">
                <div className="age-icon">3️⃣</div>
                <h3>Ages 3–4</h3>
                <p>Simple shapes & colors</p>
              </Link>
              <Link href="/shop?age=4-5" className="age-card">
                <div className="age-icon">4️⃣</div>
                <h3>Ages 4–5</h3>
                <p>Learning & creativity</p>
              </Link>
              <Link href="/shop?age=5-6" className="age-card">
                <div className="age-icon">5️⃣</div>
                <h3>Ages 5–6</h3>
                <p>Advanced activities</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Shop by Theme */}
        <section className="section bg-light">
          <div className="container">
            <h2 className="section-title">Shop by Theme</h2>
            <div className="grid grid-cols-4">
              <Link href="/shop?theme=abc-letters" className="theme-card">
                <span className="theme-emoji">🔤</span>
                <p>ABC & Letters</p>
              </Link>
              <Link href="/shop?theme=numbers" className="theme-card">
                <span className="theme-emoji">🔢</span>
                <p>Numbers</p>
              </Link>
              <Link href="/shop?theme=animals" className="theme-card">
                <span className="theme-emoji">🐾</span>
                <p>Animals</p>
              </Link>
              <Link href="/shop?theme=dinosaurs" className="theme-card">
                <span className="theme-emoji">🦕</span>
                <p>Dinosaurs</p>
              </Link>
              <Link href="/shop?theme=vehicles" className="theme-card">
                <span className="theme-emoji">🚗</span>
                <p>Vehicles</p>
              </Link>
              <Link href="/shop?theme=space" className="theme-card">
                <span className="theme-emoji">🚀</span>
                <p>Space</p>
              </Link>
              <Link href="/shop?theme=ocean" className="theme-card">
                <span className="theme-emoji">🌊</span>
                <p>Ocean</p>
              </Link>
              <Link href="/shop?theme=nature" className="theme-card">
                <span className="theme-emoji">🌲</span>
                <p>Nature</p>
              </Link>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="section">
          <div className="container">
            <h2 className="section-title">Featured Products</h2>
            <div className="grid grid-cols-3">
              {[
                {
                  id: 1,
                  name: 'ABC Coloring Adventure',
                  age: 'Ages 3–5',
                  price: '₹299',
                  emoji: '🔤'
                },
                {
                  id: 2,
                  name: 'Dinosaur Coloring Adventure',
                  age: 'Ages 4–6',
                  price: '₹349',
                  emoji: '🦕'
                },
                {
                  id: 3,
                  name: 'Ocean Animals Coloring Book',
                  age: 'Ages 3–6',
                  price: '₹349',
                  emoji: '🌊'
                },
              ].map((product) => (
                <Link key={product.id} href={`/product/${product.name.toLowerCase().replace(/\s+/g, '-')}`} className="product-card">
                  <div className="product-image">
                    <div className="placeholder-image">{product.emoji}</div>
                  </div>
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="text-muted">{product.age}</p>
                    <p className="price">{product.price}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why Parents Choose Us */}
        <section className="section bg-light">
          <div className="container">
            <h2 className="section-title">Why Parents Choose Us</h2>
            <div className="grid grid-cols-2">
              <div className="benefit">
                <div className="benefit-icon">✨</div>
                <h3>Simple Activities</h3>
                <p>Thoughtfully designed activities that kids actually enjoy.</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">👧</div>
                <h3>For Young Children</h3>
                <p>Created specifically for ages 3–6 with appropriate difficulty levels.</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">🖨️</div>
                <h3>Easy to Print</h3>
                <p>High-quality PDFs ready to print at home or your favorite print shop.</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">⚡</div>
                <h3>Instant Access</h3>
                <p>Download immediately after purchase. No shipping, no waiting.</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">🧠</div>
                <h3>Fun & Educational</h3>
                <p>Learning skills while having creative, colorful fun.</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">❤️</div>
                <h3>Made with Care</h3>
                <p>Created by parents, for parents. We understand what works.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Brand Story */}
        <section className="section">
          <div className="container container-sm">
            <h2 className="section-title text-center">Our Story</h2>
            <div className="story-content">
              <p>
                When my daughter was three, I started looking for coloring sheets and simple activities. I found that useful content was scattered everywhere—one site had coloring pages, another had worksheets, another had activities.
              </p>
              <p>
                I'd jump from site to site trying to find everything in one place. It was frustrating.
              </p>
              <p>
                That's when I realized: <strong>Why isn't there one simple place where parents can find creative activities for their little ones?</strong>
              </p>
              <p>
                That's why we created Little Hands, Big Imagination—one simple place to discover beautiful, thoughtfully designed activities for kids ages 3–6.
              </p>
              <p style={{ marginBottom: 0; }}>
                We hope these pages bring plenty of coloring, curiosity, and happy moments. ❤️
              </p>
            </div>
            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link href="/about" className="btn btn-outline">
                Read Our Full Story
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="container text-center">
            <h2>Ready to Start Coloring?</h2>
            <p>Explore our full collection of activities designed for your little one.</p>
            <Link href="/shop" className="btn btn-primary btn-lg">
              Shop Now
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
