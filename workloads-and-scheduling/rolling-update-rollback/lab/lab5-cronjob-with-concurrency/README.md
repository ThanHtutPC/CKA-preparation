## Objective
- Schedule a Job that runs every minute
- Test `concurrencyPolicy: Forbid` to prevent overlap
- Trigger a run manually

## Key takeaways
- Cron format: `minute hour day-of-month month day-of-week`
- `concurrencyPolicy`: Allow (default) | Forbid | Replace
- History retained: `successfulJobsHistoryLimit` / `failedJobsHistoryLimit`
- `startingDeadlineSeconds` = grace period if controller was down
- CronJobs use UTC unless `timeZone` is set (K8s 1.27+)
