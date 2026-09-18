const crypto = require('crypto');
const pool = require('./db');
const storage = require('./storage');

// How long a customer keeps access, and how many times they may download.
const ACCESS_DAYS = 30;
const MAX_DOWNLOADS = 20;

function generateDownloadToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create download access for one product in a paid order.
 * Called from the Stripe webhook only, after payment is verified.
 */
async function createDownloadAccess(orderId, productId) {
  const token = generateDownloadToken();
  const expiresAt = new Date(Date.now() + ACCESS_DAYS * 24 * 60 * 60 * 1000);

  const result = await pool.query(
    `INSERT INTO download_access (order_id, product_id, access_token, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, access_token`,
    [orderId, productId, token, expiresAt]
  );

  return result.rows[0];
}

/**
 * Look up a token and confirm it is still usable.
 * Returns null for anything invalid - expired, revoked, over the download
 * limit, or attached to an order that is not paid.
 */
async function verifyDownloadToken(token) {
  if (!token || typeof token !== 'string' || token.length !== 64) {
    return null;
  }

  const result = await pool.query(
    `SELECT da.id, da.download_count, da.expires_at, da.is_expired,
            p.id AS product_id, p.name, p.pdf_file_url,
            o.payment_status, o.order_number
     FROM download_access da
     JOIN products p ON da.product_id = p.id
     JOIN orders o ON da.order_id = o.id
     WHERE da.access_token = $1`,
    [token]
  );

  const access = result.rows[0];
  if (!access) return null;

  // The payment check is the important one: access rows are only created
  // after a verified webhook, but re-checking costs nothing and guards
  // against a refund or chargeback flipping the order later.
  if (access.payment_status !== 'paid') return null;
  if (access.is_expired) return null;
  if (access.expires_at && new Date(access.expires_at) < new Date()) return null;
  if (access.download_count >= MAX_DOWNLOADS) return null;

  return access;
}

async function updateDownloadCount(accessId) {
  await pool.query(
    `UPDATE download_access
     SET download_count = download_count + 1,
         last_downloaded_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [accessId]
  );
}

/** Revoke a single download link (e.g. after a refund). */
async function revokeAccess(accessId) {
  await pool.query(
    'UPDATE download_access SET is_expired = true WHERE id = $1',
    [accessId]
  );
}

/** Revoke every link attached to an order. */
async function revokeOrderAccess(orderId) {
  await pool.query(
    'UPDATE download_access SET is_expired = true WHERE order_id = $1',
    [orderId]
  );
}

/**
 * Turn a verified access row into a temporary download URL.
 * The stored pdf_file_url is an R2 object key, never a public URL.
 */
async function getSignedUrlForAccess(access) {
  if (!access || !access.pdf_file_url) return null;

  const safeName = `${access.name.replace(/[^a-zA-Z0-9 -]/g, '')} - RangPankh.pdf`;

  return storage.getSignedPdfUrl(access.pdf_file_url, {
    expiresIn: 3600,
    downloadName: safeName,
  });
}

/** Build the customer-facing link that goes in the confirmation email. */
function buildDownloadLink(token) {
  const base = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${base}/download/${token}`;
}

module.exports = {
  generateDownloadToken,
  createDownloadAccess,
  verifyDownloadToken,
  updateDownloadCount,
  revokeAccess,
  revokeOrderAccess,
  getSignedUrlForAccess,
  buildDownloadLink,
  ACCESS_DAYS,
  MAX_DOWNLOADS,
};
