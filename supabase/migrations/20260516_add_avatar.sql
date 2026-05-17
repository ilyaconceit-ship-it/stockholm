-- Add avatar field to staff_members table
ALTER TABLE staff_members ADD COLUMN IF NOT EXISTS avatar TEXT;
