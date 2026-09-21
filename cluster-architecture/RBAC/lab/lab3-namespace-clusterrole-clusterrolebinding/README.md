Create a ClusterRole named secret-reader that allows get, list, and watch on secrets (all namespaces do not matter — this is just a ClusterRole definition).
Create a ServiceAccount named reader in namespace dev.
Create a RoleBinding named reader-secret-reader in namespace dev that binds the ClusterRole secret-reader to the ServiceAccount reader.
Verify that the ServiceAccount can read secrets in namespace dev only, but NOT in namespace prod.
