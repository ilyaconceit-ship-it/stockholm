-- Allow users to insert their own roles during first-time Discord OAuth
-- This is safe because the roles are validated server-side via Discord API
CREATE POLICY "users can insert own roles"
  ON public.user_roles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own roles (needed for role refresh)
CREATE POLICY "users can delete own roles"
  ON public.user_roles
  FOR DELETE
  USING (auth.uid() = user_id);
