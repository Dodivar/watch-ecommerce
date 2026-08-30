-- Order receipt PDFs — private Storage bucket + path column on orders.
-- Access: backend service role only (no public/authenticated Storage policies).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS receipt_storage_path text;

COMMENT ON COLUMN orders.receipt_storage_path IS
  'Path in order-receipts bucket, e.g. {site_id}/{order_id}/receipt.pdf';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-receipts',
  'order-receipts',
  false,
  5242880,
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
