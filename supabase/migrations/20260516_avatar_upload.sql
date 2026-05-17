-- Add avatar_url field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for avatars (run this in Supabase Dashboard -> Storage)
-- Bucket name: avatars
-- Public: true
-- File size limit: 5MB
-- Allowed MIME types: image/*
