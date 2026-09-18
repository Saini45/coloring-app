'use client';

export type CartItem = {
  id: number;
  slug: string;
  name: string;
  price_cents: number;
  cover_image_url?: string | null;
  theme_slug?: string | null;
  quantity: number;
};

const STORAGE_KEY = 'rangpankh_cart';
const CART_EVENT = 'rangpankh:cart-changed';

function isBrowser() {
  return typeof window !== 'undefined';
}

export function getCart(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage can fail in private mode — the page still works, the cart just won't persist.
  }
  window.dispatchEvent(new CustomEvent(CART_EVENT));
}

export function addToCart(item: Omit<CartItem, 'quantity'>, quantity = 1) {
  const cart = getCart();
  const existing = cart.find((entry) => entry.id === item.id);

  if (existing) {
    // Digital PDFs: owning one copy is enough, so never stack beyond 1.
    existing.quantity = 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }

  saveCart(cart);
  return cart;
}

export function removeFromCart(id: number) {
  const cart = getCart().filter((entry) => entry.id !== id);
  saveCart(cart);
  return cart;
}

export function clearCart() {
  saveCart([]);
  return [];
}

export function cartCount(): number {
  return getCart().length;
}

export function cartSubtotalCents(): number {
  return getCart().reduce(
    (sum, entry) => sum + entry.price_cents * entry.quantity,
    0
  );
}

export function isInCart(id: number): boolean {
  return getCart().some((entry) => entry.id === id);
}

export function onCartChange(handler: () => void) {
  if (!isBrowser()) return () => {};
  window.addEventListener(CART_EVENT, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(CART_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
