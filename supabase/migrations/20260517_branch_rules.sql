-- Create rules/памятка table for each branch
CREATE TABLE IF NOT EXISTS public.branch_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch TEXT NOT NULL, -- 'broadcaster', 'moderator', etc.
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.branch_rules ENABLE ROW LEVEL SECURITY;

-- Allow approved users to read rules
CREATE POLICY "rules read approved" ON public.branch_rules
  FOR SELECT
  USING (public.is_approved(auth.uid()));

-- Allow branch admins to manage their branch rules
CREATE POLICY "rules admin write" ON public.branch_rules
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_' || branch)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_' || branch)
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_branch_rules_branch ON public.branch_rules(branch, display_order);

COMMENT ON TABLE public.branch_rules IS 'Branch-specific rules/памятка that admins can manage';
