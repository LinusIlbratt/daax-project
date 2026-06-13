-- Personal calendar events per admin (tandläkare, hämta på skolan, etc.)
-- Admins can read all; insert/update/delete only own rows (enforced by RLS).

CREATE TABLE IF NOT EXISTS public.personal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0),
  time_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS personal_events_user_id_idx ON public.personal_events (user_id);
CREATE INDEX IF NOT EXISTS personal_events_event_date_idx ON public.personal_events (event_date);

COMMENT ON TABLE public.personal_events IS 'Private admin calendar reminders; visible to all CMS admins, editable only by owner.';
COMMENT ON COLUMN public.personal_events.time_text IS 'Optional free-text time, e.g. 10:00';

ALTER TABLE public.personal_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "personal_events_select_admin" ON public.personal_events;
CREATE POLICY "personal_events_select_admin"
  ON public.personal_events FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "personal_events_insert_own" ON public.personal_events;
CREATE POLICY "personal_events_insert_own"
  ON public.personal_events FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() AND user_id = auth.uid());

DROP POLICY IF EXISTS "personal_events_update_own" ON public.personal_events;
CREATE POLICY "personal_events_update_own"
  ON public.personal_events FOR UPDATE
  TO authenticated
  USING (public.is_admin() AND user_id = auth.uid())
  WITH CHECK (public.is_admin() AND user_id = auth.uid());

DROP POLICY IF EXISTS "personal_events_delete_own" ON public.personal_events;
CREATE POLICY "personal_events_delete_own"
  ON public.personal_events FOR DELETE
  TO authenticated
  USING (public.is_admin() AND user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS personal_events_updated_at ON public.personal_events;
CREATE TRIGGER personal_events_updated_at
  BEFORE UPDATE ON public.personal_events
  FOR EACH ROW
  EXECUTE PROCEDURE public.set_updated_at();

-- Admin directory for calendar dropdown (emails from auth.users)
CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE (
  id UUID,
  email TEXT,
  display_name TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ur.id,
    u.email::TEXT,
    COALESCE(
      NULLIF(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      NULLIF(trim(u.raw_user_meta_data ->> 'name'), ''),
      split_part(u.email, '@', 1)
    ) AS display_name
  FROM public.user_roles ur
  INNER JOIN auth.users u ON u.id = ur.id
  WHERE ur.role = 'ADMIN'
  ORDER BY display_name;
$$;

REVOKE ALL ON FUNCTION public.list_admin_users() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_admin_users() TO authenticated;
