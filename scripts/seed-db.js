const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedDatabase() {
  try {
    console.log('Seeding database with sample data...');
    
    // Create categories
    const categories = [
      { name: 'Coloring Books', slug: 'coloring-books' },
      { name: 'Activity Worksheets', slug: 'activity-worksheets' },
      { name: 'Printable Packs', slug: 'printable-packs' },
    ];
    
    for (const cat of categories) {
      await pool.query(
        'INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [cat.name, cat.slug]
      );
    }
    
    // Create themes
    const themes = [
      { name: 'ABC & Letters', slug: 'abc-letters' },
      { name: 'Numbers', slug: 'numbers' },
      { name: 'Animals', slug: 'animals' },
      { name: 'Dinosaurs', slug: 'dinosaurs' },
      { name: 'Vehicles', slug: 'vehicles' },
      { name: 'Space', slug: 'space' },
      { name: 'Ocean', slug: 'ocean' },
      { name: 'Farm', slug: 'farm' },
      { name: 'Nature', slug: 'nature' },
      { name: 'Jungle', slug: 'jungle' },
    ];
    
    for (const theme of themes) {
      await pool.query(
        'INSERT INTO themes (name, slug) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [theme.name, theme.slug]
      );
    }
    
    // Get IDs
    const colorbookCat = await pool.query(
      'SELECT id FROM categories WHERE slug = $1',
      ['coloring-books']
    );
    const categoryId = colorbookCat.rows[0].id;
    
    const dinosaurTheme = await pool.query(
      'SELECT id FROM themes WHERE slug = $1',
      ['dinosaurs']
    );
    const themeId = dinosaurTheme.rows[0].id;
    
    // Create sample products
    const products = [
      {
        name: 'ABC Coloring Adventure',
        slug: 'abc-coloring-adventure',
        description: 'Learn letters while coloring!',
        long_description: 'A delightful collection of coloring pages featuring each letter of the alphabet. Perfect for children 3-5 years old who are beginning to recognize letters.',
        category_id: categoryId,
        theme_id: (await pool.query('SELECT id FROM themes WHERE slug = $1', ['abc-letters'])).rows[0].id,
        min_age: 3,
        max_age: 5,
        page_count: 26,
        price_cents: 29900, // ₹299
        seo_title: 'ABC Coloring Book for Ages 3-5',
        seo_description: 'Interactive alphabet coloring book perfect for preschoolers learning letters.',
        is_published: true,
        is_featured: true,
      },
      {
        name: 'Dinosaur Coloring Adventure',
        slug: 'dinosaur-coloring-adventure',
        description: 'Roar into creativity with dinosaurs!',
        long_description: 'Exciting dinosaur coloring pages with fun facts. Features different species from T-Rex to Triceratops. Great for ages 4-6.',
        category_id: categoryId,
        theme_id: themeId,
        min_age: 4,
        max_age: 6,
        page_count: 20,
        price_cents: 34900, // ₹349
        seo_title: 'Dinosaur Coloring Book for Ages 4-6',
        seo_description: 'Fun dinosaur themed coloring pages with educational facts for young explorers.',
        is_published: true,
        is_featured: true,
      },
      {
        name: 'Cute Animals Coloring Book',
        slug: 'cute-animals-coloring-book',
        description: 'Adorable animal friends to color',
        long_description: 'Featuring cute and friendly animals from around the world. Perfect for introducing children to different animals while developing coloring skills.',
        category_id: categoryId,
        theme_id: (await pool.query('SELECT id FROM themes WHERE slug = $1', ['animals'])).rows[0].id,
        min_age: 3,
        max_age: 5,
        page_count: 22,
        price_cents: 29900, // ₹299
        seo_title: 'Cute Animals Coloring Book for Toddlers',
        seo_description: 'Sweet and simple animal coloring pages designed for young children ages 3-5.',
        is_published: true,
        is_featured: true,
      },
      {
        name: 'Vehicles Coloring Book',
        slug: 'vehicles-coloring-book',
        description: 'Cars, trucks, and more!',
        long_description: 'From cars and trucks to buses and trains. A colorful collection for children who love vehicles.',
        category_id: categoryId,
        theme_id: (await pool.query('SELECT id FROM themes WHERE slug = $1', ['vehicles'])).rows[0].id,
        min_age: 4,
        max_age: 6,
        page_count: 18,
        price_cents: 29900, // ₹299
        seo_title: 'Vehicles Coloring Book for Kids',
        seo_description: 'Exciting vehicle themed coloring pages for children who love cars, trucks and transportation.',
        is_published: true,
        is_featured: true,
      },
      {
        name: 'Ocean Animals Coloring Book',
        slug: 'ocean-animals-coloring-book',
        description: 'Dive into underwater colors',
        long_description: 'Beautiful ocean creatures including fish, dolphins, whales, and sea turtles. An underwater adventure for little artists.',
        category_id: categoryId,
        theme_id: (await pool.query('SELECT id FROM themes WHERE slug = $1', ['ocean'])).rows[0].id,
        min_age: 3,
        max_age: 6,
        page_count: 24,
        price_cents: 34900, // ₹349
        seo_title: 'Ocean Animals Coloring Book',
        seo_description: 'Underwater coloring pages featuring whales, fish, dolphins and other sea creatures.',
        is_published: true,
        is_featured: true,
      },
    ];
    
    for (const product of products) {
      await pool.query(
        `INSERT INTO products 
        (name, slug, description, long_description, category_id, theme_id, min_age, max_age, page_count, 
         price_cents, seo_title, seo_description, is_published, is_featured) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        ON CONFLICT (slug) DO NOTHING`,
        [
          product.name, product.slug, product.description, product.long_description,
          product.category_id, product.theme_id, product.min_age, product.max_age,
          product.page_count, product.price_cents, product.seo_title, product.seo_description,
          product.is_published, product.is_featured,
        ]
      );
    }
    
    console.log('✓ Database seeded with sample products');
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedDatabase();
