## Objective
- Deploy a 3-replica StatefulSet with stable network identities
- Use a headless Service (clusterIP: None) for DNS
- Verify per-pod DNS, per-pod PVC, and ordered rollout

## Key takeaways
- Pods get stable names (web-0, web-1, …) — not random hashes
- Headless Service gives each pod its own DNS A record
- PVCs are retained when the StatefulSet is deleted (data safety)
- `podManagementPolicy: OrderedReady` (default) vs `Parallel`
- Update strategies: `RollingUpdate` (default) or `OnDelete`
