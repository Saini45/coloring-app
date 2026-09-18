import Link from 'next/link';
import './Footer.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-section">
              <h4>Little Hands, Big Imagination</h4>
              <p>One simple place for parents to find creative and meaningful activities for their little ones.</p>
              <div className="social-links">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram">📷</a>
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" title="Facebook">f</a>
              </div>
            </div>

            <div className="footer-section">
              <h4>Shop</h4>
              <ul>
                <li><Link href="/shop">All Products</Link></li>
                <li><Link href="/shop?age=3-4">Ages 3–4</Link></li>
                <li><Link href="/shop?age=4-5">Ages 4–5</Link></li>
                <li><Link href="/shop?age=5-6">Ages 5–6</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Company</h4>
              <ul>
                <li><Link href="/about">About Us</Link></li>
                <li><Link href="/contact">Contact</Link></li>
                <li><Link href="/faq">FAQ</Link></li>
                <li><Link href="/blog">Blog</Link></li>
              </ul>
            </div>

            <div className="footer-section">
              <h4>Legal</h4>
              <ul>
                <li><Link href="/privacy">Privacy Policy</Link></li>
                <li><Link href="/terms">Terms of Service</Link></li>
                <li><Link href="/returns">Returns & Refunds</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© {currentYear} Little Hands, Big Imagination. All rights reserved.</p>
            <p className="footer-tagline">Made with ❤️ for curious little minds.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
