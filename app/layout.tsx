import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Little Hands, Big Imagination | Coloring Books & Activities for Kids',
  description: 'Discover creative coloring books and activity worksheets designed for curious little minds. Instant digital download.',
  keywords: 'coloring books, preschool activities, toddler worksheets, educational printables',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://rangpankh.co.in',
    siteName: 'Little Hands, Big Imagination',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
