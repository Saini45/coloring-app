/**
 * Object storage for RangPankh, backed by Cloudflare R2.
 *
 * Two buckets, because covers and PDFs have opposite needs:
 *   - assets bucket  (public)  : cover images, preview pages. Served fast, shareable.
 *   - files bucket   (private) : the actual product PDFs. Only ever reachable
 *                                through a short-lived signed URL.
 *
 * R2 speaks the S3 API, so this also works against AWS S3 by changing the
 * endpoint and region. Nothing here runs in the browser — these credentials
 * must never be exposed to the client.
 */

const crypto = require('crypto');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

const ASSETS_BUCKET = process.env.R2_ASSETS_BUCKET || 'rangpankh-assets';
const FILES_BUCKET = process.env.R2_FILES_BUCKET || 'rangpankh-files';

// Public base URL for the assets bucket (r2.dev subdomain, or your own CDN domain).
const ASSETS_PUBLIC_URL = (process.env.R2_ASSETS_PUBLIC_URL || '').replace(/\/$/, '');

let client = null;

function getClient() {
  if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
    throw new Error(
      'R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY.'
    );
  }

  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: ACCESS_KEY_ID,
        secretAccessKey: SECRET_ACCESS_KEY,
      },
    });
  }

  return client;
}

function isConfigured() {
  return Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY);
}

/** Turn a filename into something safe to use as an object key. */
function slugifyFilename(filename) {
  const dot = filename.lastIndexOf('.');
  const base = dot > 0 ? filename.slice(0, dot) : filename;
  const ext = dot > 0 ? filename.slice(dot).toLowerCase() : '';

  const safeBase = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'file';

  const suffix = crypto.randomBytes(4).toString('hex');
  return `${safeBase}-${suffix}${ext}`;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_BYTES = 100 * 1024 * 1024; // 100 MB

/**
 * Upload a cover or preview image to the public assets bucket.
 * Returns the public URL to store in the products table.
 */
async function uploadImage(buffer, filename, contentType, folder = 'covers') {
  if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
    throw new Error('Only JPEG, PNG and WebP images are allowed.');
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    throw new Error('Image is larger than the 5 MB limit.');
  }
  if (!ASSETS_PUBLIC_URL) {
    throw new Error('R2_ASSETS_PUBLIC_URL is not set.');
  }

  const key = `${folder}/${slugifyFilename(filename)}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: ASSETS_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );

  return `${ASSETS_PUBLIC_URL}/${key}`;
}

/**
 * Upload a product PDF to the private files bucket.
 * Returns the object KEY (not a URL) — the key is what gets stored in
 * products.pdf_file_url, and it is never handed to the browser directly.
 */
async function uploadPdf(buffer, filename) {
  if (buffer.length > MAX_PDF_BYTES) {
    throw new Error('PDF is larger than the 100 MB limit.');
  }

  // Check the magic bytes rather than trusting the declared content type.
  const header = buffer.subarray(0, 5).toString('ascii');
  if (header !== '%PDF-') {
    throw new Error('That file is not a valid PDF.');
  }

  const key = `pdfs/${slugifyFilename(filename)}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: FILES_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'application/pdf',
    })
  );

  return key;
}

/**
 * Generate a short-lived signed URL for a private PDF.
 * Called only after payment and token checks have passed.
 */
async function getSignedPdfUrl(key, { expiresIn = 3600, downloadName } = {}) {
  if (!key) return null;

  const command = new GetObjectCommand({
    Bucket: FILES_BUCKET,
    Key: key,
    ResponseContentDisposition: downloadName
      ? `attachment; filename="${downloadName.replace(/"/g, '')}"`
      : 'attachment',
  });

  return getSignedUrl(getClient(), command, { expiresIn });
}

/** Delete an object. Used when a PDF or cover is replaced. */
async function deleteObject(key, { bucket = FILES_BUCKET } = {}) {
  if (!key) return;
  try {
    await getClient().send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key })
    );
  } catch (err) {
    // A failed cleanup shouldn't break the admin action that triggered it.
    console.error('Failed to delete object', key, err);
  }
}

/** Given a stored public asset URL, work back to its object key. */
function assetUrlToKey(url) {
  if (!url || !ASSETS_PUBLIC_URL) return null;
  if (!url.startsWith(ASSETS_PUBLIC_URL)) return null;
  return url.slice(ASSETS_PUBLIC_URL.length + 1);
}

module.exports = {
  isConfigured,
  uploadImage,
  uploadPdf,
  getSignedPdfUrl,
  deleteObject,
  assetUrlToKey,
  slugifyFilename,
  ASSETS_BUCKET,
  FILES_BUCKET,
};
