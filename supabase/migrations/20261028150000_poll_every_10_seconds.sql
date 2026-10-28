select cron.alter_job(
  (select jobid from cron.job where jobname = 'poll-calls'),
  schedule := '10 seconds'
);
