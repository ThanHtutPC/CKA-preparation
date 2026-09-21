In namespace blue, create a Role named pod-reader that allows get on pods, but ONLY for the pod named readablepod.
Create a ServiceAccount restricted-reader in namespace blue.
Bind the Role to the ServiceAccount.
Verify that get works for readablepod but fails for any other pod name.
