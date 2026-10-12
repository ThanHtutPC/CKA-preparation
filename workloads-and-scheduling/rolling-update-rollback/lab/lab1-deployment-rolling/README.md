## Objective
- Deploy a stateless app (nginx) with 4 replicas
- Perform a rolling update v1 → v2 with **zero downtime**
- Roll back to v1 using `kubectl rollout undo`
