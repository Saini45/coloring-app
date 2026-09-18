import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Build dynamic query based on filters
    let query = 'SELECT * FROM products WHERE is_published = true';
    const params: any[] = [];
    let paramIndex = 1;

    // Filter by age range
    const age = searchParams.get('age');
    if (age) {
      const [minAge, maxAge] = age.split('-').map(Number);
      query += ` AND min_age <= $${paramIndex} AND max_age >= $${paramIndex}`;
      params.push(minAge);
      paramIndex++;
    }

    // Filter by theme
    const theme = searchParams.get('theme');
    if (theme) {
      query += ` AND theme_id = (SELECT id FROM themes WHERE slug = $${paramIndex})`;
      params.push(theme);
      paramIndex++;
    }

    // Filter by category
    const category = searchParams.get('category');
    if (category) {
      query += ` AND category_id = (SELECT id FROM categories WHERE slug = $${paramIndex})`;
      params.push(category);
      paramIndex++;
    }

    // Search by name
    const search = searchParams.get('search');
    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Add ordering and pagination
    query += ' ORDER BY created_at DESC LIMIT 100';

    const result = await pool.query(query, params);
    
    return NextResponse.json({
      success: true,
      products: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    console.error('Error fetching products:', err);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
