CREATE TABLE inquiries (
  id TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL UNIQUE,
  public_reference TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  service_category TEXT,
  team_size TEXT,
  current_tools TEXT,
  interest TEXT,
  workflow_problem TEXT NOT NULL,
  scenario_interest TEXT,
  marketing_consent INTEGER NOT NULL DEFAULT 0,
  source_path TEXT,
  ip_hash TEXT,
  user_agent TEXT,
  google_status TEXT NOT NULL,
  notify_status TEXT NOT NULL,
  google_attempts INTEGER NOT NULL DEFAULT 0,
  notify_attempts INTEGER NOT NULL DEFAULT 0,
  google_next_at TEXT,
  notify_next_at TEXT,
  google_error TEXT,
  notify_error TEXT,
  google_confirmed_at TEXT,
  notify_confirmed_at TEXT
);

CREATE INDEX idx_inquiries_google ON inquiries (google_status, google_next_at);
CREATE INDEX idx_inquiries_notify ON inquiries (notify_status, notify_next_at);

CREATE TABLE rate_limits (
  bucket_key TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL,
  PRIMARY KEY (bucket_key, window_start)
);

CREATE TABLE deletion_log (
  id TEXT PRIMARY KEY,
  inquiry_id TEXT NOT NULL,
  public_reference TEXT NOT NULL,
  deleted_at TEXT NOT NULL
);
