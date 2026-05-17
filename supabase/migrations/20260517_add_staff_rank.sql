-- Add rank field to staff_members for hierarchy within categories
ALTER TABLE public.staff_members
ADD COLUMN IF NOT EXISTS rank TEXT;

-- Add comment explaining rank usage
COMMENT ON COLUMN public.staff_members.rank IS 'Subcategory/rank within main category (e.g., "Мастера", "Куратор", "Главный куратор", "Лучший админ ветки")';
