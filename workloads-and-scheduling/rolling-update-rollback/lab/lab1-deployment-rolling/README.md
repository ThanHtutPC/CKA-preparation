## Objective
- Deploy a stateless app (nginx) with 4 replicas
- Perform a rolling update v1 → v2 with **zero downtime**
- Roll back to v1 using `kubectl rollout undo`

## Key takeaways
- Each rollout creates a new ReplicaSet = a new revision
- `maxSurge` / `maxUnavailable` control speed vs availability
- Rollback is instant because old ReplicaSet is only scaled down, not deleted
- `revisionHistoryLimit` caps how many old RS are kept (default 10)
