Quick Reference Summary
Task	Command
Check upgrade plan	<sudo kubeadm upgrade plan>
Upgrade first control plane	<sudo kubeadm upgrade apply v1.35.x >
Upgrade additional control plane	<sudo kubeadm upgrade node>
Upgrade worker node	<sudo kubeadm upgrade node>
Drain node	<kubectl drain <node> --ignore-daemonsets --delete-emptydir-data>
Uncordon node	<kubectl uncordon <node>>
Hold/unhold packages	<sudo apt-mark hold/unhold kubeadm kubelet kubectl>
Restart kubelet	<sudo systemctl daemon-reload && sudo systemctl restart kubelet>
Verify	<kubectl get nodes, kubectl get pods -n kube-system>
