create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'refresh-token-balances-every-5min',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://ubauaedefaafdmyygiiu.supabase.co/functions/v1/get-token-balances',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViYXVhZWRlZmFhZmRteXlnaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTI4NDIsImV4cCI6MjA4MjM4ODg0Mn0.FiLhV_ToM4dgWQbccUXL-AdYUz-SMdjNIgZ1u2Lj55Y","x-refresh-secret":"73c6bd1f380235a663807b1cb38d23eb838542a6ed350bdb"}'::jsonb,
    body := '{"source":"cron"}'::jsonb
  );
  $$
);

create or replace function public.trigger_balance_refresh()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://ubauaedefaafdmyygiiu.supabase.co/functions/v1/get-token-balances',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InViYXVhZWRlZmFhZmRteXlnaWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTI4NDIsImV4cCI6MjA4MjM4ODg0Mn0.FiLhV_ToM4dgWQbccUXL-AdYUz-SMdjNIgZ1u2Lj55Y","x-refresh-secret":"73c6bd1f380235a663807b1cb38d23eb838542a6ed350bdb"}'::jsonb,
    body := '{"source":"tx_trigger"}'::jsonb
  );
  return new;
end;
$$;

revoke all on function public.trigger_balance_refresh() from public, anon, authenticated;

drop trigger if exists on_new_transaction_refresh_balances on public.transactions;
create trigger on_new_transaction_refresh_balances
after insert on public.transactions
for each row execute function public.trigger_balance_refresh();