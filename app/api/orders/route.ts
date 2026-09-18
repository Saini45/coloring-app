import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { createPaymentIntent } from '@/lib/stripe';
import crypto from 'crypto';

// Generate unique order number
function generateOrderNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerName, customerEmail, items } = body;

    // Validate input
    if (!customerName || !customerEmail || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate total
    let totalCents = 0;
    const orderItems: Array<{
      product_id: number;
      product_name: string;
      quantity: number;
      price_cents: number;
    }> = [];

    for (const item of items) {
      const productResult = await pool.query(
        'SELECT id, name, price_cents FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        return NextResponse.json(
          { error: `Product ${item.product_id} not found` },
          { status: 404 }
        );
      }

      const product = productResult.rows[0];
      const itemTotal = product.price_cents * (item.quantity || 1);
      totalCents += itemTotal;

      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity || 1,
        price_cents: product.price_cents,
      });
    }

    // Create order
    const orderNumber = generateOrderNumber();
    const orderResult = await pool.query(
      `INSERT INTO orders (order_number, customer_name, customer_email, total_cents, status, payment_status)
       VALUES ($1, $2, $3, $4, 'pending', 'pending')
       RETURNING id`,
      [orderNumber, customerName, customerEmail, totalCents]
    );

    const orderId = orderResult.rows[0].id;

    // Add order items
    for (const item of orderItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, product_name, quantity, price_cents)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderId, item.product_id, item.product_name, item.quantity, item.price_cents]
      );
    }

    // Create Stripe payment intent
    const paymentIntent = await createPaymentIntent(totalCents, orderId);

    // Update order with payment intent ID
    await pool.query(
      'UPDATE orders SET stripe_payment_intent_id = $1 WHERE id = $2',
      [paymentIntent.id, orderId]
    );

    return NextResponse.json({
      success: true,
      order: {
        id: orderId,
        order_number: orderNumber,
        total_cents: totalCents,
        customer_email: customerEmail,
      },
      payment: {
        clientSecret: paymentIntent.client_secret,
        amount: totalCents,
      },
    });
  } catch (err) {
    console.error('Error creating order:', err);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('id');
    const email = searchParams.get('email');

    let query = 'SELECT * FROM orders WHERE';
    const params: any[] = [];

    if (orderId) {
      query += ' id = $1';
      params.push(orderId);
    } else if (email) {
      query += ' customer_email = $1';
      params.push(email);
    } else {
      return NextResponse.json(
        { error: 'Provide id or email parameter' },
        { status: 400 }
      );
    }

    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = result.rows[0];

    // Get order items
    const itemsResult = await pool.query(
      'SELECT * FROM order_items WHERE order_id = $1',
      [order.id]
    );

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: itemsResult.rows,
      },
    });
  } catch (err) {
    console.error('Error fetching order:', err);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
