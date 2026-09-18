'use client';

import { useEffect, useState } from 'react';

type Props = {
  images: string[];
  productName: string;
  pageCount?: number | null;
};

export default function PreviewGallery({
  images,
  productName,
  pageCount,
}: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    if (openIndex === null) return;

    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenIndex(null);
      if (event.key === 'ArrowRight')
        setOpenIndex((i) => (i === null ? null : (i + 1) % images.length));
      if (event.key === 'ArrowLeft')
        setOpenIndex((i) =>
          i === null ? null : (i - 1 + images.length) % images.length
        );
    }

    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [openIndex, images.length]);

  if (!images.length) {
    return (
      <div className="preview-placeholder">
        <span>📄</span>
        <p>
          Sample pages are coming soon
          {pageCount ? ` — this book has ${pageCount} pages` : ''}.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="preview-grid">
        {images.map((src, index) => (
          <button
            key={src}
            type="button"
            className="preview-thumb"
            onClick={() => setOpenIndex(index)}
            aria-label={`View sample page ${index + 1} of ${productName}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${productName} — sample page ${index + 1}`}
              loading="lazy"
            />
            <span className="preview-zoom">🔍</span>
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setOpenIndex(null)}
            aria-label="Close preview"
          >
            ✕
          </button>

          {images.length > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-prev"
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex((i) =>
                  i === null ? null : (i - 1 + images.length) % images.length
                );
              }}
              aria-label="Previous page"
            >
              ‹
            </button>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="lightbox-image"
            src={images[openIndex]}
            alt={`${productName} — sample page ${openIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />

          {images.length > 1 && (
            <button
              type="button"
              className="lightbox-nav lightbox-next"
              onClick={(e) => {
                e.stopPropagation();
                setOpenIndex((i) =>
                  i === null ? null : (i + 1) % images.length
                );
              }}
              aria-label="Next page"
            >
              ›
            </button>
          )}

          <p className="lightbox-counter">
            {openIndex + 1} / {images.length}
          </p>
        </div>
      )}
    </>
  );
}
