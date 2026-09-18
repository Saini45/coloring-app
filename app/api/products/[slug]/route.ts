import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const result = await pool.query(
      `SELECT p.*, 
              c.name as category_name, 
              t.name as theme_name
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN themes t ON p.theme_id = t.id
       WHERE p.slug = $1 AND p.is_published = true`,
      [params.slug]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      product: result.rows[0],
    });
  } catch (err) {
    console.error('Error fetching product:', err);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}
