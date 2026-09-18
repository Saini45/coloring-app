const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Send order confirmation email
async function sendOrderConfirmation(customerEmail, customerName, order, downloadUrl) {
  const products = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product_name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${(item.price_cents / 100).toFixed(2)}</td>
    </tr>
  `).join('');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px; }
        .header h1 { margin: 0; font-size: 28px; }
        .header p { margin: 5px 0 0 0; font-size: 16px; opacity: 0.9; }
        .content { margin: 30px 0; }
        .order-details { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .order-details h3 { margin-top: 0; color: #333; }
        table { width: 100%; border-collapse: collapse; }
        .download-button {
          display: inline-block;
          background: #667eea;
          color: white;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 6px;
          margin: 20px 0;
          font-weight: 600;
        }
        .download-button:hover { background: #5568d3; }
        .footer { color: #666; font-size: 14px; text-align: center; padding: 20px; border-top: 1px solid #eee; margin-top: 30px; }
        .order-number { font-family: monospace; background: #e8eaf6; padding: 2px 6px; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎨 Your Coloring Adventure is Ready!</h1>
          <p>Little Hands, Big Imagination</p>
        </div>
        
        <div class="content">
          <p>Hi ${customerName},</p>
          
          <p>Thank you for your purchase! Your order has been confirmed and your download is ready.</p>
          
          <div class="order-details">
            <h3>Order Details</h3>
            <p><strong>Order Number:</strong> <span class="order-number">${order.order_number}</span></p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString()}</p>
            
            <h4>Items:</h4>
            <table>
              ${products}
              <tr style="font-weight: bold;">
                <td style="padding: 10px; border-top: 2px solid #667eea;">Total</td>
                <td style="padding: 10px; border-top: 2px solid #667eea;">₹${(order.total_cents / 100).toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center;">
            <a href="${downloadUrl}" class="download-button">Download Your Product</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            <strong>Note:</strong> Your download link is secure and personal to you. It can be used multiple times and is valid for 30 days.
          </p>
          
          <p>We hope these pages bring plenty of coloring, curiosity, and happy moments for your little one! 💙</p>
          
          <p>If you have any questions or need help, please reply to this email.</p>
          
          <div class="footer">
            <p>Little Hands, Big Imagination</p>
            <p style="margin: 10px 0 0 0; font-size: 12px;">One simple place for parents to find creative and meaningful activities for their little ones.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const msg = {
    to: customerEmail,
    from: process.env.SENDGRID_FROM_EMAIL || 'orders@rangpankh.co.in',
    subject: '🎨 Your Coloring Adventure is Ready to Download',
    html: html,
  };
  
  try {
    await sgMail.send(msg);
    console.log('Order confirmation email sent to:', customerEmail);
    return true;
  } catch (err) {
    console.error('Error sending email:', err);
    return false;
  }
}

module.exports = {
  sendOrderConfirmation,
};
