## Objective
- Run a batch Job that completes 6 tasks
- Execute up to 2 in parallel
- Observe completions, backoff, and cleanup

## Key takeaways
- `completions` = total successful pods required
- `parallelism` = max pods running at once
- `backoffLimit` = retries before Job fails (default 6)
- `activeDeadlineSeconds` = hard wall-clock timeout
- `ttlSecondsAfterFinished` = auto-delete finished Job after N seconds
- Set `restartPolicy: OnFailure` or `Never` — never `Always`
