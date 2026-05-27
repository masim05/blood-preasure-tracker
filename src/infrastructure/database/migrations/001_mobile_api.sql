CREATE TABLE IF NOT EXISTS user_accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS bearer_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_bearer_tokens_user_id ON bearer_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_bearer_tokens_expires_at ON bearer_tokens(expires_at);

CREATE TABLE IF NOT EXISTS measurements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user_accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  systolic INTEGER,
  diastolic INTEGER,
  pulse INTEGER,
  arm_side TEXT,
  measurement_time TIMESTAMPTZ NOT NULL,
  image_id TEXT,
  recognition_error TEXT,
  saved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_measurements_user_status_time ON measurements(user_id, status, measurement_time DESC);

CREATE TABLE IF NOT EXISTS measurement_images (
  id TEXT PRIMARY KEY,
  measurement_id TEXT NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_measurement_images_measurement_id ON measurement_images(measurement_id);

CREATE TABLE IF NOT EXISTS recognition_tasks (
  id TEXT PRIMARY KEY,
  measurement_id TEXT NOT NULL REFERENCES measurements(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  available_at TIMESTAMPTZ NOT NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recognition_tasks_status_available ON recognition_tasks(status, available_at);
