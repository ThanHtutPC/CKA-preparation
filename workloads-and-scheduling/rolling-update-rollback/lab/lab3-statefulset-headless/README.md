## Objective
- Deploy a 3-replica StatefulSet with stable network identities
- Use a headless Service (clusterIP: None) for DNS
- Verify per-pod DNS, per-pod PVC, and ordered rollout
