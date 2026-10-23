create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

-- Sends no request on a project without both Vault secrets, since the join finds no row.
select cron.schedule(
  'poll-calls',
  '* * * * *',
  $$
  select net.http_post(
    url := rtrim(app_url.decrypted_secret, '/') || '/api/jobs/poll',
    headers := jsonb_build_object('x-cron-secret', cron_secret.decrypted_secret),
    timeout_milliseconds := 10000
  )
  from vault.decrypted_secrets app_url, vault.decrypted_secrets cron_secret
  where app_url.name = 'app_url' and cron_secret.name = 'cron_secret'
  $$
);
