-- =====================================================
-- STAFF SHOP POINTS SYSTEM
-- Автоматический подсчет баллов для модераторов
-- =====================================================

-- 1. CREATE SHIFTS TABLE (Смены)
CREATE TABLE IF NOT EXISTS public.shifts (
  id SERIAL PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL, -- "Смена 1", "Смена 2", "Смена 11"
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(branch_id, name)
);

CREATE INDEX idx_shifts_branch ON public.shifts(branch_id);

ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.shifts IS 'Смены модераторов (Смена 1, Смена 2, и т.д.)';

-- 2. ADD FIELDS TO STAFF_MEMBERS
ALTER TABLE public.staff_members
  ADD COLUMN IF NOT EXISTS shift_id INTEGER REFERENCES public.shifts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS total_points DECIMAL(10,2) DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS attended_meeting BOOLEAN DEFAULT false;

CREATE INDEX idx_staff_shift ON public.staff_members(shift_id);
CREATE INDEX idx_staff_points ON public.staff_members(total_points);

COMMENT ON COLUMN public.staff_members.shift_id IS 'Закрепленная смена модератора';
COMMENT ON COLUMN public.staff_members.total_points IS 'Итоговый баланс баллов для стафф-шопа';
COMMENT ON COLUMN public.staff_members.attended_meeting IS 'Посетил ли последнее собрание';

-- 3. CREATE SHIFT_WEEKS TABLE (Недельные периоды)
CREATE TABLE IF NOT EXISTS public.shift_weeks (
  id SERIAL PRIMARY KEY,
  shift_id INTEGER NOT NULL REFERENCES public.shifts(id) ON DELETE CASCADE,
  week_start DATE NOT NULL, -- Понедельник недели
  week_end DATE NOT NULL,   -- Воскресенье недели
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(shift_id, week_start),
  CHECK (week_end = week_start + INTERVAL '6 days')
);

CREATE INDEX idx_shift_weeks_shift ON public.shift_weeks(shift_id);
CREATE INDEX idx_shift_weeks_dates ON public.shift_weeks(week_start, week_end);
CREATE INDEX idx_shift_weeks_archived ON public.shift_weeks(is_archived);

ALTER TABLE public.shift_weeks ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.shift_weeks IS 'Недельные периоды для каждой смены (ПН-ВС)';

-- 4. CREATE SHIFT_ATTENDANCE TABLE (Посещаемость + Доп.часы)
CREATE TABLE IF NOT EXISTS public.shift_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_week_id INTEGER NOT NULL REFERENCES public.shift_weeks(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,

  -- Посещаемость по дням (true = присутствовал, false/null = отсутствовал)
  monday BOOLEAN DEFAULT false,
  tuesday BOOLEAN DEFAULT false,
  wednesday BOOLEAN DEFAULT false,
  thursday BOOLEAN DEFAULT false,
  friday BOOLEAN DEFAULT false,
  saturday BOOLEAN DEFAULT false,
  sunday BOOLEAN DEFAULT false,

  -- Дополнительные часы за неделю (максимум 168 часов = 7 дней * 24 часа)
  extra_hours DECIMAL(5,2) DEFAULT 0 NOT NULL CHECK (extra_hours >= 0 AND extra_hours <= 168),

  -- Статус отпуска/отгула
  vacation_days INTEGER DEFAULT 0 CHECK (vacation_days >= 0 AND vacation_days <= 7),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(shift_week_id, staff_id)
);

CREATE INDEX idx_attendance_week ON public.shift_attendance(shift_week_id);
CREATE INDEX idx_attendance_staff ON public.shift_attendance(staff_id);
CREATE INDEX idx_attendance_extra_hours ON public.shift_attendance(extra_hours);

ALTER TABLE public.shift_attendance ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.shift_attendance IS 'Посещаемость модераторов по дням + дополнительные часы';
COMMENT ON COLUMN public.shift_attendance.extra_hours IS 'Дополнительные часы работы (2 часа = 1 балл)';

-- 5. CREATE POINTS_HISTORY TABLE (История начисления баллов)
CREATE TABLE IF NOT EXISTS public.points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  shift_week_id INTEGER REFERENCES public.shift_weeks(id) ON DELETE SET NULL,

  points_earned DECIMAL(10,2) NOT NULL, -- Начисленные баллы (может быть отрицательным при списании)
  extra_hours DECIMAL(5,2), -- Сколько доп. часов было за эту неделю
  reason TEXT NOT NULL, -- "weekly_extra_hours", "manual_adjustment", "shop_purchase"
  notes TEXT, -- Дополнительные заметки (например, название товара из шопа)

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) -- Кто начислил (админ или система)
);

CREATE INDEX idx_points_history_staff ON public.points_history(staff_id);
CREATE INDEX idx_points_history_week ON public.points_history(shift_week_id);
CREATE INDEX idx_points_history_created ON public.points_history(created_at DESC);
CREATE INDEX idx_points_history_reason ON public.points_history(reason);

ALTER TABLE public.points_history ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.points_history IS 'Полная история всех начислений и списаний баллов';
COMMENT ON COLUMN public.points_history.reason IS 'Причина: weekly_extra_hours, manual_adjustment, shop_purchase';

-- 6. TRIGGER FUNCTION: Автоматическое начисление баллов
CREATE OR REPLACE FUNCTION public.calculate_and_award_points()
RETURNS TRIGGER AS $$
DECLARE
  points_to_award DECIMAL(10,2);
  old_points DECIMAL(10,2);
  current_user_id UUID;
BEGIN
  -- Получаем ID текущего пользователя (админа)
  BEGIN
    current_user_id := current_setting('request.jwt.claims', true)::json->>'sub';
  EXCEPTION WHEN OTHERS THEN
    current_user_id := NULL;
  END;

  -- Рассчитываем баллы: 2 часа = 1 балл (дробные баллы поддерживаются)
  points_to_award := NEW.extra_hours / 2.0;

  -- Если это UPDATE, вычитаем старые баллы
  IF TG_OP = 'UPDATE' THEN
    old_points := OLD.extra_hours / 2.0;
    points_to_award := points_to_award - old_points;
  END IF;

  -- Обновляем общий баланс модератора (только если баллы изменились)
  IF points_to_award != 0 THEN
    UPDATE public.staff_members
    SET total_points = total_points + points_to_award
    WHERE id = NEW.staff_id;

    -- Записываем в историю
    INSERT INTO public.points_history (
      staff_id,
      shift_week_id,
      points_earned,
      extra_hours,
      reason,
      created_by
    ) VALUES (
      NEW.staff_id,
      NEW.shift_week_id,
      points_to_award,
      NEW.extra_hours,
      'weekly_extra_hours',
      current_user_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на INSERT и UPDATE
DROP TRIGGER IF EXISTS trigger_award_points ON public.shift_attendance;
CREATE TRIGGER trigger_award_points
AFTER INSERT OR UPDATE OF extra_hours ON public.shift_attendance
FOR EACH ROW
EXECUTE FUNCTION public.calculate_and_award_points();

COMMENT ON FUNCTION public.calculate_and_award_points() IS 'Автоматически начисляет баллы при изменении extra_hours';

-- 7. HELPER FUNCTIONS

-- Создать новую неделю для смены
CREATE OR REPLACE FUNCTION public.create_new_week_for_shift(p_shift_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_week_start DATE;
  v_week_end DATE;
  v_new_week_id INTEGER;
BEGIN
  -- Находим ближайший понедельник
  v_week_start := date_trunc('week', CURRENT_DATE)::DATE;
  v_week_end := v_week_start + INTERVAL '6 days';

  -- Создаем новую неделю (если еще не существует)
  INSERT INTO public.shift_weeks (shift_id, week_start, week_end)
  VALUES (p_shift_id, v_week_start, v_week_end)
  ON CONFLICT (shift_id, week_start) DO UPDATE SET shift_id = EXCLUDED.shift_id
  RETURNING id INTO v_new_week_id;

  RETURN v_new_week_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_new_week_for_shift(INTEGER) IS 'Создает новую неделю для смены (текущий понедельник)';

-- Архивировать старые недели
CREATE OR REPLACE FUNCTION public.archive_old_weeks()
RETURNS INTEGER AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  -- Архивируем недели старше 7 дней
  UPDATE public.shift_weeks
  SET
    is_archived = true,
    archived_at = NOW()
  WHERE
    week_end < CURRENT_DATE - INTERVAL '7 days'
    AND is_archived = false;

  GET DIAGNOSTICS archived_count = ROW_COUNT;
  RETURN archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.archive_old_weeks() IS 'Архивирует недели старше 7 дней';

-- Ручная корректировка баллов (для админов)
CREATE OR REPLACE FUNCTION public.adjust_staff_points(
  p_staff_id UUID,
  p_points DECIMAL(10,2),
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_history_id UUID;
  current_user_id UUID;
BEGIN
  -- Получаем ID текущего пользователя
  BEGIN
    current_user_id := current_setting('request.jwt.claims', true)::json->>'sub';
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Не удалось определить текущего пользователя';
  END;

  -- Проверяем права (только admin или admin_moderator)
  IF NOT (
    public.has_role(current_user_id, 'admin') OR
    public.has_role(current_user_id, 'admin_moderator')
  ) THEN
    RAISE EXCEPTION 'Недостаточно прав для корректировки баллов';
  END IF;

  -- Обновляем баланс
  UPDATE public.staff_members
  SET total_points = total_points + p_points
  WHERE id = p_staff_id;

  -- Записываем в историю
  INSERT INTO public.points_history (
    staff_id,
    points_earned,
    reason,
    notes,
    created_by
  ) VALUES (
    p_staff_id,
    p_points,
    p_reason,
    p_notes,
    current_user_id
  ) RETURNING id INTO v_history_id;

  RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.adjust_staff_points(UUID, DECIMAL, TEXT, TEXT) IS 'Ручная корректировка баллов админом';

-- 8. INSERT DEFAULT SHIFTS FOR MODERATOR BRANCH
DO $$
DECLARE
  moderator_branch_id UUID;
BEGIN
  -- Находим ID ветки модераторов
  SELECT id INTO moderator_branch_id FROM public.branches WHERE name = 'moderator';

  IF moderator_branch_id IS NOT NULL THEN
    -- Создаем смены 1-11 для модераторов
    INSERT INTO public.shifts (branch_id, name, description) VALUES
      (moderator_branch_id, 'Смена 1', 'Первая смена модераторов'),
      (moderator_branch_id, 'Смена 2', 'Вторая смена модераторов'),
      (moderator_branch_id, 'Смена 3', 'Третья смена модераторов'),
      (moderator_branch_id, 'Смена 4', 'Четвертая смена модераторов'),
      (moderator_branch_id, 'Смена 5', 'Пятая смена модераторов'),
      (moderator_branch_id, 'Смена 6', 'Шестая смена модераторов'),
      (moderator_branch_id, 'Смена 7', 'Седьмая смена модераторов'),
      (moderator_branch_id, 'Смена 8', 'Восьмая смена модераторов'),
      (moderator_branch_id, 'Смена 9', 'Девятая смена модераторов'),
      (moderator_branch_id, 'Смена 10', 'Десятая смена модераторов'),
      (moderator_branch_id, 'Смена 11', 'Одиннадцатая смена модераторов')
    ON CONFLICT (branch_id, name) DO NOTHING;
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
