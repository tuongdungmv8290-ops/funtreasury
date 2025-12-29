-- Create table to store API settings like Moralis API key
CREATE TABLE public.api_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name text NOT NULL UNIQUE,
  key_value text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admins can view all api_settings" 
ON public.api_settings 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage api_settings" 
ON public.api_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_api_settings_updated_at
BEFORE UPDATE ON public.api_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default settings
INSERT INTO public.api_settings (key_name, key_value) VALUES
  ('MORALIS_API_KEY', NULL);