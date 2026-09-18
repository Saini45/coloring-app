'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addToCart, isInCart, onCartChange, type CartItem } from '@/lib/cart';

type Props = {
  product: Omit<CartItem, 'quantity'>;
};

export default function AddToCartButtons({ product }: Props) {
  const router = useRouter();
  const [inCart, setInCart] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setInCart(isInCart(product.id));
    return onCartChange(() => setInCart(isInCart(product.id)));
  }, [product.id]);

  function handleAdd() {
    addToCart(product);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 2000);
  }

  function handleBuyNow() {
    addToCart(product);
    router.push('/checkout');
  }

  return (
    <div className="buy-actions">
      <button
        type="button"
        className="btn btn-outline btn-lg"
        onClick={handleAdd}
      >
        {justAdded ? '✓ Added' : inCart ? 'In your cart' : 'Add to Cart'}
      </button>

      <button
        type="button"
        className="btn btn-primary btn-lg"
        onClick={handleBuyNow}
      >
        Buy Now
      </button>
    </div>
  );
}
