-- Add gender-based broadcaster categories
INSERT INTO public.staff_categories (name, branch, display_order) VALUES
('Бродкастер (М)', 'broadcaster', 6),
('Бродкастер (Ж)', 'broadcaster', 7)
ON CONFLICT (name, branch) DO NOTHING;

-- Update existing "Бродкастер" category display_order to keep hierarchy
UPDATE public.staff_categories
SET display_order = 5
WHERE name = 'Бродкастер' AND branch = 'broadcaster';
