-- Additive local/production migration: an expiring claim prevents concurrent
-- Worker delivery attempts. Existing inquiry records and statuses are retained.
CREATE TABLE inquiry_delivery_claims (
  inquiry_id TEXT PRIMARY KEY,
  claim_token TEXT NOT NULL,
  claimed_until TEXT NOT NULL
);
