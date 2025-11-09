CREATE TABLE IF NOT EXISTS social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL UNIQUE,
  url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT social_links_supported_platform CHECK (platform IN ('facebook', 'instagram'))
);

CREATE INDEX IF NOT EXISTS social_links_active_idx ON social_links(is_active);

INSERT INTO social_links (platform, is_active)
VALUES
  ('facebook', FALSE),
  ('instagram', FALSE)
ON CONFLICT (platform) DO NOTHING;
