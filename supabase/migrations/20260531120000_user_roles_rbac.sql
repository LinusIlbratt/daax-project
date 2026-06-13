-- RBAC: user_roles + RLS tied to ADMIN / CUSTOMER roles

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'CUSTOMER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_roles_role_idx ON public.user_roles (role);

COMMENT ON TABLE public.user_roles IS 'App roles per auth user. CMS requires ADMIN.';
COMMENT ON COLUMN public.user_roles.role IS 'ADMIN = CMS, CUSTOMER = future customer portal';

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.id = auth.uid() AND ur.role = 'ADMIN'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_customer()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.id = auth.uid() AND ur.role = 'CUSTOMER'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_customer() TO authenticated, anon;

-- user_roles policies
DROP POLICY IF EXISTS "user_roles_select_own" ON public.user_roles;
CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "user_roles_admin_all" ON public.user_roles;
CREATE POLICY "user_roles_admin_all"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ---------- products ----------
DROP POLICY IF EXISTS "Allow public read" ON products;
DROP POLICY IF EXISTS "products_authenticated_insert" ON products;
DROP POLICY IF EXISTS "products_authenticated_update" ON products;
DROP POLICY IF EXISTS "products_authenticated_delete" ON products;

DROP POLICY IF EXISTS "products_select_catalog" ON products;
CREATE POLICY "products_select_catalog"
  ON products FOR SELECT
  USING (
    public.is_admin()
    OR (
      is_active = true
      AND (auth.role() = 'anon' OR public.is_customer())
    )
  );

DROP POLICY IF EXISTS "products_insert_admin" ON products;
CREATE POLICY "products_insert_admin"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() AND created_by = auth.uid());

DROP POLICY IF EXISTS "products_update_admin" ON products;
CREATE POLICY "products_update_admin"
  ON products FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "products_delete_admin" ON products;
CREATE POLICY "products_delete_admin"
  ON products FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------- bookings ----------
DROP POLICY IF EXISTS "bookings_select_authenticated" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_authenticated" ON bookings;
DROP POLICY IF EXISTS "bookings_update_authenticated" ON bookings;
DROP POLICY IF EXISTS "bookings_delete_authenticated" ON bookings;

DROP POLICY IF EXISTS "bookings_select_admin" ON bookings;
CREATE POLICY "bookings_select_admin"
  ON bookings FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "bookings_select_own_customer" ON bookings;
CREATE POLICY "bookings_select_own_customer"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    public.is_customer()
    AND lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

DROP POLICY IF EXISTS "bookings_insert_admin" ON bookings;
CREATE POLICY "bookings_insert_admin"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bookings_update_admin" ON bookings;
CREATE POLICY "bookings_update_admin"
  ON bookings FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "bookings_delete_admin" ON bookings;
CREATE POLICY "bookings_delete_admin"
  ON bookings FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ---------- blocked_dates ----------
DROP POLICY IF EXISTS "blocked_dates_select_authenticated" ON blocked_dates;
DROP POLICY IF EXISTS "blocked_dates_insert_authenticated" ON blocked_dates;
DROP POLICY IF EXISTS "blocked_dates_update_authenticated" ON blocked_dates;
DROP POLICY IF EXISTS "blocked_dates_delete_authenticated" ON blocked_dates;

DROP POLICY IF EXISTS "blocked_dates_select_admin" ON blocked_dates;
CREATE POLICY "blocked_dates_select_admin"
  ON blocked_dates FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "blocked_dates_insert_admin" ON blocked_dates;
CREATE POLICY "blocked_dates_insert_admin"
  ON blocked_dates FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "blocked_dates_update_admin" ON blocked_dates;
CREATE POLICY "blocked_dates_update_admin"
  ON blocked_dates FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "blocked_dates_delete_admin" ON blocked_dates;
CREATE POLICY "blocked_dates_delete_admin"
  ON blocked_dates FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- blocked_dates_select_anon unchanged (customer booking calendar)

-- Bootstrap first CMS admin (run once in SQL Editor after you know the auth user id):
-- INSERT INTO public.user_roles (id, role) VALUES ('<auth-users-uuid>', 'ADMIN')
-- ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, updated_at = NOW();
