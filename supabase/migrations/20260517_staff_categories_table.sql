-- Create categories table for dynamic category management
CREATE TABLE IF NOT EXISTS public.staff_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  branch TEXT NOT NULL, -- 'broadcaster', 'moderator', 'helper', etc.
  display_order INTEGER NOT NULL DEFAULT 0, -- lower = higher in hierarchy
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.staff_categories ENABLE ROW LEVEL SECURITY;

-- Allow approved users to read categories
CREATE POLICY "categories read approved" ON public.staff_categories
  FOR SELECT
  USING (public.is_approved(auth.uid()));

-- Allow admins and branch admins to manage categories
CREATE POLICY "categories admin write" ON public.staff_categories
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_broadcaster') OR
    public.has_role(auth.uid(), 'admin_moderator')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_broadcaster') OR
    public.has_role(auth.uid(), 'admin_moderator')
  );

-- Add category_id to staff_members (keep old category for backward compatibility)
ALTER TABLE public.staff_members
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.staff_categories(id);

-- Insert default broadcaster categories
INSERT INTO public.staff_categories (name, branch, display_order) VALUES
('Лучший админ ветки', 'broadcaster', 1),
('Тех.куратор', 'broadcaster', 2),
('Куратор', 'broadcaster', 3),
('Мастер', 'broadcaster', 4),
('Бродкастер', 'broadcaster', 5);

-- Insert default moderator categories (you can add more via admin panel)
INSERT INTO public.staff_categories (name, branch, display_order) VALUES
('Лучший админ ветки', 'moderator', 1),
('Главный куратор', 'moderator', 2),
('Куратор', 'moderator', 3),
('Мастера', 'moderator', 4),
('Модератор', 'moderator', 5);

COMMENT ON TABLE public.staff_categories IS 'Dynamic staff categories/ranks that can be managed via admin panel';
COMMENT ON COLUMN public.staff_categories.display_order IS 'Lower number = higher in hierarchy (1 is top)';
