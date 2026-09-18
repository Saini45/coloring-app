const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent for checkout
async function createPaymentIntent(amount, orderId) {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount), // Amount in cents
    currency: 'inr',
    metadata: {
      orderId: orderId.toString(),
    },
  });
  
  return paymentIntent;
}

// Get payment intent details
async function getPaymentIntent(paymentIntentId) {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

// Verify webhook signature
function verifyWebhookSignature(body, signature) {
  try {
    return stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return null;
  }
}

// Handle successful payment
async function handlePaymentSuccess(paymentIntentId, pool) {
  const paymentIntent = await getPaymentIntent(paymentIntentId);
  const orderId = paymentIntent.metadata.orderId;
  
  // Update order in database
  await pool.query(
    `UPDATE orders 
     SET status = 'completed', 
         payment_status = 'paid',
         stripe_charge_id = $1,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $2`,
    [paymentIntent.charges.data[0]?.id, orderId]
  );
  
  return orderId;
}

module.exports = {
  stripe,
  createPaymentIntent,
  getPaymentIntent,
  verifyWebhookSignature,
  handlePaymentSuccess,
};
