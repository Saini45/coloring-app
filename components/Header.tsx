'use client';

import Link from 'next/link';
import { useState } from 'react';
import './Header.css';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        <Link href="/" className="logo">
          <span className="logo-emoji">🎨</span>
          <span className="logo-text">RangPankh</span>
        </Link>

        <nav className={`nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/cart" className="nav-cart">
            <span>🛒 Cart</span>
          </Link>
        </nav>

        <button 
          className="mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </header>
  );
}
