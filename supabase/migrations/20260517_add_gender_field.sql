-- Add gender field to staff_members
ALTER TABLE public.staff_members
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', NULL));

COMMENT ON COLUMN public.staff_members.gender IS 'Gender for broadcasters: male or female';
