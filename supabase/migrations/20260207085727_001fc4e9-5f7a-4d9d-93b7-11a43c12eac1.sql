
-- 1. Bảng price_cache cho edge function
CREATE TABLE public.price_cache (
  id TEXT PRIMARY KEY DEFAULT 'crypto_prices',
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.price_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read price_cache"
ON public.price_cache FOR SELECT
USING (true);

CREATE POLICY "Service role can manage price_cache"
ON public.price_cache FOR ALL
USING (true)
WITH CHECK (true);

INSERT INTO public.price_cache (id, data) VALUES ('crypto_prices', '[]'::jsonb);

-- 2. Update trigger function to also insert notification for receiver
CREATE OR REPLACE FUNCTION public.update_light_scores_on_gift()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  sender_name TEXT;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    SELECT display_name INTO sender_name
    FROM public.profiles
    WHERE user_id = NEW.sender_id
    LIMIT 1;

    INSERT INTO public.light_scores (user_id, total_given_usd, gift_count_sent, light_score, updated_at)
    VALUES (NEW.sender_id, NEW.usd_value, 1, (NEW.usd_value * 2) + (1 * 10), now())
    ON CONFLICT (user_id) DO UPDATE SET
      total_given_usd = light_scores.total_given_usd + NEW.usd_value,
      gift_count_sent = light_scores.gift_count_sent + 1,
      light_score = ((light_scores.total_given_usd + NEW.usd_value) * 2) + (light_scores.total_received_usd * 1) + ((light_scores.gift_count_sent + 1) * 10) + (light_scores.gift_count_received * 5),
      updated_at = now();

    INSERT INTO public.light_scores (user_id, total_received_usd, gift_count_received, light_score, updated_at)
    VALUES (NEW.receiver_id, NEW.usd_value, 1, (NEW.usd_value * 1) + (1 * 5), now())
    ON CONFLICT (user_id) DO UPDATE SET
      total_received_usd = light_scores.total_received_usd + NEW.usd_value,
      gift_count_received = light_scores.gift_count_received + 1,
      light_score = (light_scores.total_given_usd * 2) + ((light_scores.total_received_usd + NEW.usd_value) * 1) + (light_scores.gift_count_sent * 10) + ((light_scores.gift_count_received + 1) * 5),
      updated_at = now();

    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.posts
      SET total_gifts_received = total_gifts_received + NEW.usd_value,
          gift_count = gift_count + 1, updated_at = now()
      WHERE id = NEW.post_id;
    END IF;

    INSERT INTO public.messages (sender_id, receiver_id, content, gift_id)
    VALUES (
      NEW.sender_id, NEW.receiver_id,
      '🎁 Bạn đã nhận được ' || NEW.amount || ' ' || NEW.token_symbol || ' (~$' || ROUND(NEW.usd_value, 2) || ')' ||
      CASE WHEN NEW.message IS NOT NULL THEN ' - "' || NEW.message || '"' ELSE '' END ||
      CASE WHEN NEW.tx_hash IS NOT NULL THEN ' | Tx: ' || NEW.tx_hash ELSE '' END,
      NEW.id
    );

    INSERT INTO public.notifications (title, description, type, metadata)
    VALUES (
      '🎁 Nhận được ' || NEW.amount || ' ' || NEW.token_symbol,
      'Từ ' || COALESCE(sender_name, 'người dùng') || ' (~$' || ROUND(NEW.usd_value, 2) || ')',
      'success',
      jsonb_build_object('gift_id', NEW.id, 'sender_id', NEW.sender_id, 'amount', NEW.amount, 'token', NEW.token_symbol)
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
