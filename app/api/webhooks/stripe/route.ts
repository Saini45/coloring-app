import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import pool from '@/lib/db';
import { verifyWebhookSignature, handlePaymentSuccess } from '@/lib/stripe';
import { createDownloadAccess } from '@/lib/downloads';

// Convert Node stream to string
async function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  });
}

export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const event = verifyWebhookSignature(body, signature);
    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 403 }
      );
    }

    console.log(`Processing webhook event: ${event.type}`);

    // Handle specific events
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success to acknowledge receipt
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    // Get order details
    const orderResult = await pool.query(
      `SELECT o.id, o.order_number, o.customer_email, o.customer_name
       FROM orders o
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      console.error(`Order ${orderId} not found`);
      return;
    }

    const order = orderResult.rows[0];

    // Update order status
    await pool.query(
      `UPDATE orders 
       SET status = 'completed', 
           payment_status = 'paid',
           stripe_charge_id = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [paymentIntent.charges.data[0]?.id, orderId]
    );

    // Get order items
    const itemsResult = await pool.query(
      'SELECT product_id FROM order_items WHERE order_id = $1',
      [orderId]
    );

    // Create download access for each product
    for (const item of itemsResult.rows) {
      await createDownloadAccess(orderId, item.product_id);
    }

    console.log(`✓ Payment succeeded for order ${order.order_number}`);
  } catch (err) {
    console.error('Error handling payment success:', err);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    await pool.query(
      `UPDATE orders 
       SET payment_status = 'failed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [orderId]
    );

    console.log(`⚠ Payment failed for order ${orderId}`);
  } catch (err) {
    console.error('Error handling payment failure:', err);
  }
}

async function handlePaymentIntentCanceled(paymentIntent: any) {
  try {
    const orderId = paymentIntent.metadata.orderId;

    await pool.query(
      `UPDATE orders 
       SET payment_status = 'canceled',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [orderId]
    );

    console.log(`⚠ Payment canceled for order ${orderId}`);
  } catch (err) {
    console.error('Error handling payment cancellation:', err);
  }
}
