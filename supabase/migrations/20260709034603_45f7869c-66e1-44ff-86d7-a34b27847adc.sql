
-- camly_transfers: restrict inserts to admins
DROP POLICY IF EXISTS "Authenticated can insert" ON public.camly_transfers;
CREATE POLICY "Admins can insert transfers"
ON public.camly_transfers
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- notifications: restrict inserts to admins (triggers run as SECURITY DEFINER and bypass RLS)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
CREATE POLICY "Admins can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_achievements: block direct client inserts (only trigger via SECURITY DEFINER inserts)
DROP POLICY IF EXISTS "System can insert user_achievements" ON public.user_achievements;
CREATE POLICY "Admins can insert user_achievements"
ON public.user_achievements
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Revoke EXECUTE on SECURITY DEFINER trigger/helper functions from public roles
REVOKE ALL ON FUNCTION public.check_achievements() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prevent_gift_modification() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_light_scores_on_gift() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.find_duplicate_transactions() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
-- has_role must stay callable by authenticated because RLS policies invoke it
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
