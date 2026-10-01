Create a DaemonSet named node-monitor in namespace kube-system that:

    Runs image prom/node-exporter:v1.6.1

    Deploys only on nodes labeled monitoring=true

    Mounts host path /proc at /host/proc (read-only)

Then label node node01 with monitoring=true and verify a Pod runs there.
