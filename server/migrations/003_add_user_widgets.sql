-- Migration: Add user_widgets table for persistent widget configuration
-- Date: 2025-10-25

CREATE TABLE IF NOT EXISTS user_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  widget_name VARCHAR(100) NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, widget_name)
);

CREATE INDEX IF NOT EXISTS idx_user_widgets_user_id ON user_widgets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_widgets_enabled ON user_widgets(user_id, is_enabled);

COMMENT ON TABLE user_widgets IS 'Stores user widget preferences and configuration';
COMMENT ON COLUMN user_widgets.config IS 'JSON configuration for widget-specific settings';
