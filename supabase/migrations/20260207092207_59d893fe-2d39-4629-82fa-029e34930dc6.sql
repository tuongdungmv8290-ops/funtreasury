
-- Fix: notifications already in supabase_realtime, just skip that line
-- Everything else was already applied in the failed transaction, so we need to re-run all

-- 1. BẢNG ADDRESS_LABELS
CREATE TABLE IF NOT EXISTS public.address_labels (
  address TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.address_labels ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view address_labels"
    ON public.address_labels FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can manage address_labels"
    ON public.address_labels FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO public.address_labels (address, label)
SELECT LOWER(w.address), w.name FROM public.wallets w
ON CONFLICT (address) DO NOTHING;

-- 2. NOTIFICATION USER_ID
DO $$ BEGIN
  ALTER TABLE public.notifications ADD COLUMN user_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DROP POLICY IF EXISTS "Admins can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING ((user_id IS NULL) OR (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING ((user_id IS NULL) OR (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can delete notifications"
  ON public.notifications FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Updated trigger with user_id
CREATE OR REPLACE FUNCTION public.update_light_scores_on_gift()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE sender_name TEXT;
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    SELECT display_name INTO sender_name FROM public.profiles WHERE user_id = NEW.sender_id LIMIT 1;

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
      UPDATE public.posts SET total_gifts_received = total_gifts_received + NEW.usd_value, gift_count = gift_count + 1, updated_at = now() WHERE id = NEW.post_id;
    END IF;

    INSERT INTO public.messages (sender_id, receiver_id, content, gift_id)
    VALUES (NEW.sender_id, NEW.receiver_id,
      '🎁 Bạn đã nhận được ' || NEW.amount || ' ' || NEW.token_symbol || ' (~$' || ROUND(NEW.usd_value, 2) || ')' ||
      CASE WHEN NEW.message IS NOT NULL THEN ' - "' || NEW.message || '"' ELSE '' END ||
      CASE WHEN NEW.tx_hash IS NOT NULL THEN ' | Tx: ' || NEW.tx_hash ELSE '' END,
      NEW.id);

    INSERT INTO public.notifications (title, description, type, metadata, user_id)
    VALUES (
      '🎁 Nhận được ' || NEW.amount || ' ' || NEW.token_symbol,
      'Từ ' || COALESCE(sender_name, 'người dùng') || ' (~$' || ROUND(NEW.usd_value, 2) || ')',
      'success',
      jsonb_build_object('gift_id', NEW.id, 'sender_id', NEW.sender_id, 'amount', NEW.amount, 'token', NEW.token_symbol),
      NEW.receiver_id);
  END IF;
  RETURN NEW;
END;
$function$;

-- 3. ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon_emoji TEXT NOT NULL DEFAULT '🏆',
  threshold_type TEXT NOT NULL,
  threshold_value NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Admins can manage achievements" ON public.achievements FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id),
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone can view user_achievements" ON public.user_achievements FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "System can insert user_achievements" ON public.user_achievements FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

INSERT INTO public.achievements (name, description, icon_emoji, threshold_type, threshold_value) VALUES
  ('First Gift', 'Tặng thưởng lần đầu tiên', '🎁', 'gift_count_sent', 1),
  ('Gift Master', 'Đã tặng 10 lần', '🎯', 'gift_count_sent', 10),
  ('Generous Heart', 'Đã tặng tổng $100', '💛', 'total_given_usd', 100),
  ('Big Spender', 'Đã tặng tổng $1,000', '💎', 'total_given_usd', 1000),
  ('Light Bearer', 'Đạt Light Score 50', '✨', 'light_score', 50),
  ('Light Champion', 'Đạt Light Score 200', '🌟', 'light_score', 200),
  ('Popular', 'Nhận được 5 lần tặng', '🤝', 'gift_count_received', 5)
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.check_achievements()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.user_achievements (user_id, achievement_id)
  SELECT NEW.user_id, a.id FROM public.achievements a
  WHERE (
    (a.threshold_type = 'gift_count_sent' AND NEW.gift_count_sent >= a.threshold_value) OR
    (a.threshold_type = 'total_given_usd' AND NEW.total_given_usd >= a.threshold_value) OR
    (a.threshold_type = 'light_score' AND NEW.light_score >= a.threshold_value) OR
    (a.threshold_type = 'gift_count_received' AND NEW.gift_count_received >= a.threshold_value)
  )
  ON CONFLICT (user_id, achievement_id) DO NOTHING;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS check_achievements_trigger ON public.light_scores;
CREATE TRIGGER check_achievements_trigger
  AFTER INSERT OR UPDATE ON public.light_scores
  FOR EACH ROW EXECUTE FUNCTION public.check_achievements();
