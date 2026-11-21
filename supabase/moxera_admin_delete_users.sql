-- Run in the connected Supabase SQL Editor before deploying this change.
-- This grants a narrow RPC, NOT direct table DELETE access to authenticated users.
BEGIN;
CREATE OR REPLACE FUNCTION public.moxera_admin_delete_users(p_user_ids uuid[])
RETURNS uuid[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_id uuid;
  v_ids uuid[];
  v_deleted uuid[];
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.moxera_admins WHERE user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Admin pekee ndiye anaruhusiwa kufuta account.' USING ERRCODE = '42501';
  END IF;
  IF p_user_ids IS NULL OR cardinality(p_user_ids) < 1 OR cardinality(p_user_ids) > 100
     OR array_position(p_user_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'Chagua account 1 hadi 100.' USING ERRCODE = '22023';
  END IF;
  SELECT array_agg(DISTINCT id) INTO v_ids FROM unnest(p_user_ids) AS t(id);
  -- Serialize deletions of the same target, and fail atomically on stale IDs.
  FOR v_id IN SELECT id FROM unnest(v_ids) AS t(id) ORDER BY id LOOP
    PERFORM 1 FROM public.moxera_users WHERE id = v_id FOR UPDATE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Account haijapatikana. Pakia orodha upya.' USING ERRCODE = '22023';
    END IF;
    IF v_id = auth.uid() OR EXISTS (SELECT 1 FROM public.moxera_admins WHERE user_id = v_id) THEN
      RAISE EXCEPTION 'Account ya admin haiwezi kufutwa hapa.' USING ERRCODE = '42501';
    END IF;
  END LOOP;
  -- Invalidate pending SMS reset attempts for deleted app profiles, if installed.
  IF to_regclass('public.moxera_sms_recovery') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.moxera_sms_recovery WHERE user_id = ANY($1)' USING v_ids;
  END IF;
  WITH removed AS (
    DELETE FROM public.moxera_users WHERE id = ANY(v_ids) RETURNING id
  ) SELECT array_agg(id) INTO v_deleted FROM removed;
  IF coalesce(cardinality(v_deleted), 0) <> cardinality(v_ids) THEN
    RAISE EXCEPTION 'Si account zote zimefutwa; jaribu tena baada ya kupakia orodha.';
  END IF;
  RETURN v_deleted;
END;
$$;
REVOKE ALL ON FUNCTION public.moxera_admin_delete_users(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moxera_admin_delete_users(uuid[]) TO authenticated;
COMMIT;
