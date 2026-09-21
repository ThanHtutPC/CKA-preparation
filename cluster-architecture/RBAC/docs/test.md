# Role 
kubectl create role pod-reader --verb=get,list,watch --resource=pods

# ClusterRole 
kubectl create clusterrole pod-reader --verb=get,list,watch --resource=pods

# RoleBinding 
kubectl create rolebinding pod-reader-binding --role=pod-reader --user=dev-user

# ClusterRoleBinding 
kubectl create clusterrolebinding pod-reader-binding --clusterrole=pod-reader --user=dev-user

# ServiceAccount 
kubectl create serviceaccount processor -n project-hamster

# Permission 
kubectl auth can-i get pods --as=dev-user
kubectl auth can-i list secrets --as=system:serviceaccount:project-hamster:processor
