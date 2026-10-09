# Logging Proportionality

Log calls should earn their place. Before adding a log:

- Is this an anomaly worth investigating, or a normal operation?
- Is this already captured by Vercel's function logs, the call's `status` and `error` columns, or framework event handlers?
- Does this add signal that cannot be recovered from the canonical summary line?

If none of the above — don't log it. One dense canonical log line at the end of an operation beats ten incremental "I am about to do X" lines.

What a log line may contain is set by `security-and-data.md`: ids, statuses and timings only.
