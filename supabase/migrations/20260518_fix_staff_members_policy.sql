-- Fix staff_members RLS policy to allow admin_moderator to update shift_id

DROP POLICY IF EXISTS "staff admin write" ON public.staff_members;

CREATE POLICY "staff admin write" ON public.staff_members
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
