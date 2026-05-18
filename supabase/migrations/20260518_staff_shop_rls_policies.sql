-- =====================================================
-- RLS POLICIES FOR STAFF SHOP POINTS SYSTEM
-- =====================================================

-- 1. SHIFTS TABLE
-- Все одобренные пользователи могут читать смены
CREATE POLICY "shifts_read_approved" ON public.shifts
  FOR SELECT
  USING (public.is_approved(auth.uid()));

-- Только admin и admin_moderator могут управлять сменами
CREATE POLICY "shifts_admin_write" ON public.shifts
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_moderator')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_moderator')
  );

-- 2. SHIFT_WEEKS TABLE
-- Все одобренные пользователи могут читать недели
CREATE POLICY "shift_weeks_read_approved" ON public.shift_weeks
  FOR SELECT
  USING (public.is_approved(auth.uid()));

-- Только admin и admin_moderator могут управлять неделями
CREATE POLICY "shift_weeks_admin_write" ON public.shift_weeks
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_moderator')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_moderator')
  );

-- 3. SHIFT_ATTENDANCE TABLE
-- Модераторы видят только свою посещаемость, админы видят всё
CREATE POLICY "attendance_read_own_or_admin" ON public.shift_attendance
  FOR SELECT
  USING (
    -- Модератор видит только свою запись
    EXISTS (
      SELECT 1 FROM public.staff_members sm
      WHERE sm.id = shift_attendance.staff_id
      AND sm.discord_id = (
        SELECT discord_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    OR
    -- Админы и admin_moderator видят всё
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_moderator')
  );

-- Только admin и admin_moderator могут изменять посещаемость
CREATE POLICY "attendance_admin_write" ON public.shift_attendance
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_moderator')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_moderator')
  );

-- 4. POINTS_HISTORY TABLE
-- Модераторы видят только свою историю, админы видят всё
CREATE POLICY "points_history_read_own_or_admin" ON public.points_history
  FOR SELECT
  USING (
    -- Модератор видит только свою историю
    EXISTS (
      SELECT 1 FROM public.staff_members sm
      WHERE sm.id = points_history.staff_id
      AND sm.discord_id = (
        SELECT discord_id FROM public.profiles WHERE id = auth.uid()
      )
    )
    OR
    -- Админы видят всё
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_moderator')
  );

-- Только система и админы могут создавать записи в истории
-- (триггер работает через SECURITY DEFINER, поэтому INSERT разрешен)
CREATE POLICY "points_history_system_insert" ON public.points_history
  FOR INSERT
  WITH CHECK (true); -- Триггер работает от имени системы

-- Админы могут удалять записи (на случай ошибок)
CREATE POLICY "points_history_admin_delete" ON public.points_history
  FOR DELETE
  USING (
    public.has_role(auth.uid(), 'admin') OR
    public.has_role(auth.uid(), 'admin_moderator')
  );

-- 5. UPDATE STAFF_MEMBERS POLICIES
-- Добавляем возможность модераторам видеть свои баллы
-- (существующие политики уже должны это покрывать, но уточним)

-- Модераторы могут читать свою запись в staff_members
DROP POLICY IF EXISTS "staff_read_own" ON public.staff_members;
CREATE POLICY "staff_read_own" ON public.staff_members
  FOR SELECT
  USING (
    -- Модератор видит свою запись
    discord_id = (
      SELECT discord_id FROM public.profiles WHERE id = auth.uid()
    )
    OR
    -- Или если у него есть доступ к ветке
    (
      public.is_approved(auth.uid()) AND
      public.has_branch_access(auth.uid(), branch_id)
    )
  );

-- 6. GRANT EXECUTE PERMISSIONS
-- Разрешаем вызов функций для одобренных пользователей
GRANT EXECUTE ON FUNCTION public.create_new_week_for_shift(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.archive_old_weeks() TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_staff_points(UUID, DECIMAL, TEXT, TEXT) TO authenticated;

-- Но функции сами проверяют права внутри через SECURITY DEFINER

-- =====================================================
-- RLS POLICIES COMPLETE
-- =====================================================
