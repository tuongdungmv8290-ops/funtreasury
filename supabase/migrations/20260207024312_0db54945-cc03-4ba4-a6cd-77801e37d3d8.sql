
-- 1. Create gifts table
CREATE TABLE public.gifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  token_symbol text NOT NULL DEFAULT 'CAMLY',
  amount numeric NOT NULL DEFAULT 0,
  usd_value numeric NOT NULL DEFAULT 0,
  tx_hash text,
  message text,
  post_id uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Create posts table
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  content text NOT NULL,
  image_url text,
  total_gifts_received numeric NOT NULL DEFAULT 0,
  gift_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  gift_id uuid REFERENCES public.gifts(id),
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Create light_scores table
CREATE TABLE public.light_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  total_given_usd numeric NOT NULL DEFAULT 0,
  total_received_usd numeric NOT NULL DEFAULT 0,
  gift_count_sent integer NOT NULL DEFAULT 0,
  gift_count_received integer NOT NULL DEFAULT 0,
  light_score numeric NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add FK for posts on gifts
ALTER TABLE public.gifts ADD CONSTRAINT gifts_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id);

-- 5. Enable RLS
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.light_scores ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for gifts
CREATE POLICY "Anyone can view gifts" ON public.gifts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert gifts" ON public.gifts FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Sender can update own gifts" ON public.gifts FOR UPDATE TO authenticated USING (auth.uid() = sender_id);

-- 7. RLS Policies for posts
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "Author can update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "Author can delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

-- 8. RLS Policies for messages
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Authenticated users can insert messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver can update read status" ON public.messages FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);

-- 9. RLS Policies for light_scores (public leaderboard)
CREATE POLICY "Anyone can view light_scores" ON public.light_scores FOR SELECT USING (true);
CREATE POLICY "System can manage light_scores" ON public.light_scores FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- 10. Trigger function to update light_scores when gift is confirmed
CREATE OR REPLACE FUNCTION public.update_light_scores_on_gift()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only trigger when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status != 'confirmed') THEN
    -- Update sender scores (upsert)
    INSERT INTO public.light_scores (user_id, total_given_usd, gift_count_sent, light_score, updated_at)
    VALUES (
      NEW.sender_id,
      NEW.usd_value,
      1,
      (NEW.usd_value * 2) + (1 * 10),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_given_usd = light_scores.total_given_usd + NEW.usd_value,
      gift_count_sent = light_scores.gift_count_sent + 1,
      light_score = ((light_scores.total_given_usd + NEW.usd_value) * 2) + (light_scores.total_received_usd * 1) + ((light_scores.gift_count_sent + 1) * 10) + (light_scores.gift_count_received * 5),
      updated_at = now();

    -- Update receiver scores (upsert)
    INSERT INTO public.light_scores (user_id, total_received_usd, gift_count_received, light_score, updated_at)
    VALUES (
      NEW.receiver_id,
      NEW.usd_value,
      1,
      (NEW.usd_value * 1) + (1 * 5),
      now()
    )
    ON CONFLICT (user_id) DO UPDATE SET
      total_received_usd = light_scores.total_received_usd + NEW.usd_value,
      gift_count_received = light_scores.gift_count_received + 1,
      light_score = (light_scores.total_given_usd * 2) + ((light_scores.total_received_usd + NEW.usd_value) * 1) + (light_scores.gift_count_sent * 10) + ((light_scores.gift_count_received + 1) * 5),
      updated_at = now();

    -- Update post gift counters if gift is linked to a post
    IF NEW.post_id IS NOT NULL THEN
      UPDATE public.posts
      SET total_gifts_received = total_gifts_received + NEW.usd_value,
          gift_count = gift_count + 1,
          updated_at = now()
      WHERE id = NEW.post_id;
    END IF;

    -- Auto-create notification message for receiver
    INSERT INTO public.messages (sender_id, receiver_id, content, gift_id)
    VALUES (
      NEW.sender_id,
      NEW.receiver_id,
      '🎁 Bạn đã nhận được ' || NEW.amount || ' ' || NEW.token_symbol || ' (~$' || ROUND(NEW.usd_value, 2) || ')' ||
      CASE WHEN NEW.message IS NOT NULL THEN ' - "' || NEW.message || '"' ELSE '' END ||
      CASE WHEN NEW.tx_hash IS NOT NULL THEN ' | Tx: ' || NEW.tx_hash ELSE '' END,
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 11. Create trigger
CREATE TRIGGER trigger_update_light_scores
  AFTER UPDATE ON public.gifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_light_scores_on_gift();

-- 12. Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.gifts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;

-- 13. Updated_at trigger for posts
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
