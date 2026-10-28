CREATE TABLE IF NOT EXISTS saved_builds (
  id uuid PRIMARY KEY,
  user_id text NOT NULL,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  build jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  source_id text,
  UNIQUE (user_id, source_id)
);
CREATE INDEX IF NOT EXISTS saved_builds_owner_created ON saved_builds(user_id, created_at, id);
