
DROP VIEW IF EXISTS public.public_profiles;

CREATE POLICY "Public can view basic profile info"
ON public.profiles FOR SELECT
TO anon, authenticated
USING (true);

REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (user_id, display_name, avatar_url) ON public.profiles TO anon;
