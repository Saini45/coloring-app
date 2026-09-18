const crypto = require('crypto');
const pool = require('./db');

// Generate secure download token
function generateDownloadToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Create download access for an order
async function createDownloadAccess(orderId, productId) {
  const token = generateDownloadToken();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
  
  const result = await pool.query(
    `INSERT INTO download_access (order_id, product_id, access_token, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, access_token`,
    [orderId, productId, token, expiresAt]
  );
  
  return result.rows[0];
}

// Verify and retrieve download access
async function verifyDownloadToken(token) {
  const result = await pool.query(
    `SELECT da.*, p.pdf_file_url, p.name
     FROM download_access da
     JOIN products p ON da.product_id = p.id
     WHERE da.access_token = $1
     AND da.is_expired = false
     AND (da.expires_at IS NULL OR da.expires_at > CURRENT_TIMESTAMP)`,
    [token]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

// Update download count
async function updateDownloadCount(tokenId) {
  await pool.query(
    `UPDATE download_access 
     SET download_count = download_count + 1,
         last_downloaded_at = CURRENT_TIMESTAMP
     WHERE id = $1`,
    [tokenId]
  );
}

// Generate secure S3 signed URL (if using S3)
async function generateS3SignedUrl(bucketKey, expiresIn = 3600) {
  const aws = require('aws-sdk');
  const s3 = new aws.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  });
  
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: bucketKey,
    Expires: expiresIn,
  };
  
  return s3.getSignedUrl('getObject', params);
}

// Get download URL for a product
async function getDownloadUrl(downloadAccessId) {
  const access = await pool.query(
    `SELECT pdf_file_url FROM download_access da
     JOIN products p ON da.product_id = p.id
     WHERE da.id = $1`,
    [downloadAccessId]
  );
  
  if (access.rows.length === 0) {
    return null;
  }
  
  const pdfUrl = access.rows[0].pdf_file_url;
  
  // If using S3, generate signed URL
  if (pdfUrl.includes('s3.amazonaws.com')) {
    const bucketKey = pdfUrl.split('.s3.amazonaws.com/')[1];
    return generateS3SignedUrl(bucketKey);
  }
  
  // Otherwise return the URL as-is (for local files, this would be a local path)
  return pdfUrl;
}

module.exports = {
  generateDownloadToken,
  createDownloadAccess,
  verifyDownloadToken,
  updateDownloadCount,
  generateS3SignedUrl,
  getDownloadUrl,
};
