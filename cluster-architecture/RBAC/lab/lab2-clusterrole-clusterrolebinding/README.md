Create a ClusterRole named node-viewer that allows get, list, and watch on nodes.
Create a ServiceAccount named monitor in namespace monitoring.
Create a ClusterRoleBinding named monitor-node-viewer that binds the ClusterRole to the ServiceAccount.
Verify that the ServiceAccount can list nodes cluster-wide, but cannot delete nodes or read secrets in any namespace.
