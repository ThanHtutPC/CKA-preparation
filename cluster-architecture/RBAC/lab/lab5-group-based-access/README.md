Create a ClusterRole named deployment-manager that allows get, list, watch, create, update, patch, and delete on deployments in the apps API group.
Create a RoleBinding in namespace web that binds this ClusterRole to the group developers.
Verify that a user in group developers can create a deployment in web, but cannot create one in default.
