-- Allow admin_broadcaster to manage staff_members (they need this for admin panel)
DROP POLICY IF EXISTS "staff admin write" ON public.staff_members;

CREATE POLICY "staff admin write" ON public.staff_members
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_broadcaster')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_broadcaster')
  );

-- Allow admin_broadcaster to manage user_roles (needed for moving users between categories)
DROP POLICY IF EXISTS "roles admin all" ON public.user_roles;

CREATE POLICY "roles admin all" ON public.user_roles
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_broadcaster')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_broadcaster')
  );

-- Allow admin_broadcaster to update profiles (needed for status changes)
DROP POLICY IF EXISTS "profiles admin update" ON public.profiles;

CREATE POLICY "profiles admin update" ON public.profiles
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_broadcaster')
  );
