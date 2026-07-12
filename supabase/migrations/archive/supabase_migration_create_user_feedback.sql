-- Migration: Create user_feedback table
-- Created: 2026-01-31
-- Purpose: Store user feedback from Settings page

-- Create user_feedback table
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email varchar,
  category varchar NOT NULL CHECK (category IN ('suggestion', 'bug', 'other')),
  feedback text NOT NULL,
  app_version varchar,
  build_number varchar,
  os_version varchar,
  platform varchar CHECK (platform IN ('ios', 'android', 'web')),
  status varchar DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'archived')),
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add comments for documentation
COMMENT ON TABLE public.user_feedback IS 'User feedback submissions from Settings page';
COMMENT ON COLUMN public.user_feedback.id IS 'Unique feedback ID';
COMMENT ON COLUMN public.user_feedback.user_id IS 'User ID (foreign key to auth.users)';
COMMENT ON COLUMN public.user_feedback.email IS 'User email for follow-up';
COMMENT ON COLUMN public.user_feedback.category IS 'Feedback category: suggestion, bug, or other';
COMMENT ON COLUMN public.user_feedback.feedback IS 'Feedback content';
COMMENT ON COLUMN public.user_feedback.app_version IS 'App version when feedback was submitted';
COMMENT ON COLUMN public.user_feedback.build_number IS 'Build number when feedback was submitted';
COMMENT ON COLUMN public.user_feedback.os_version IS 'OS version (iOS/Android version number)';
COMMENT ON COLUMN public.user_feedback.platform IS 'Platform: ios, android, or web';
COMMENT ON COLUMN public.user_feedback.status IS 'Feedback status: pending, reviewed, resolved, or archived';
COMMENT ON COLUMN public.user_feedback.admin_notes IS 'Admin notes for internal tracking';
COMMENT ON COLUMN public.user_feedback.created_at IS 'Feedback submission timestamp';
COMMENT ON COLUMN public.user_feedback.updated_at IS 'Last update timestamp';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_category ON public.user_feedback(category);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_feedback_platform ON public.user_feedback(platform);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Policy 1: Users can view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.user_feedback
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own feedback
CREATE POLICY "Users can insert their own feedback"
ON public.user_feedback
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Service role has full access (for admin dashboard)
-- This allows service role to manage all feedback entries
-- Note: This policy is automatically handled by service role bypass

-- Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to auto-update updated_at
CREATE TRIGGER update_user_feedback_updated_at
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Verify table creation
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_feedback'
ORDER BY ordinal_position;

-- Expected columns:
-- id, user_id, email, category, feedback, app_version, build_number,
-- os_version, platform, status, admin_notes, created_at, updated_at
