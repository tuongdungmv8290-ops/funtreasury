
-- 1. Restrict profile public access (hide email/telegram)
DROP POLICY IF EXISTS "Public can view basic profile info" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = false) AS
SELECT user_id, display_name, avatar_url
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- 2. Revoke EXECUTE on SECURITY DEFINER internal functions
REVOKE EXECUTE ON FUNCTION public.find_duplicate_transactions() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_gift_modification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_light_scores_on_gift() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_achievements() FROM PUBLIC, anon, authenticated;
-- keep has_role executable; it is used inside RLS policies

-- 3. Storage avatars: remove broad public listing; keep public direct-URL access via public bucket
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can list own avatar folder"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can list any avatar"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND public.has_role(auth.uid(), 'admin'::app_role)
);
