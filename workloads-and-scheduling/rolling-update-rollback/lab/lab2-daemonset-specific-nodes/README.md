## Objective
- Run a DaemonSet that schedules one pod per node
- Restrict it to nodes with a label `workload=logging`
- Observe behavior when a node is added/removed

## Key takeaways
- DaemonSet ignores `replicas`; pod count = matching nodes
- Use `nodeSelector`, `affinity`, or `tolerations` to control placement
- Perfect for log shippers, monitoring agents, CNI, kube-proxy
- Update strategies: `OnDelete` (manual) or `RollingUpdate` (default)
