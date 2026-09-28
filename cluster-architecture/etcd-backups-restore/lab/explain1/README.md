1. Theory (Key Concepts)

Why Backup etcd?

    Disaster Recovery: Losing all control plane nodes means losing the cluster state .

    Point-in-Time Snapshot: The snapshot captures the full keyspace at a specific revision. Note: It does NOT include Persistent Volume data (application data on disks is separate) .

Key Facts for the Exam:

    API Version: Always use ETCDCTL_API=3 .

    Static Pod: In kubeadm clusters, etcd runs as a static Pod in kube-system. The manifest is at /etc/kubernetes/manifests/etcd.yaml .

    Data Directory: --data-dir=/var/lib/etcd (default for kubeadm) .

    Certificates: To authenticate, you need --cacert, --cert, and --key. Paths are usually in /etc/kubernetes/pki/etcd/ .

Backup vs. Restore Workflow:

    Backup: etcdctl snapshot save → Creates a .db file.

    Restore: etcdctl snapshot restore → Writes to a NEW --data-dir (never overwrite the live data directory) .

    Reconfigure: Edit the etcd static Pod manifest to point --data-dir to the new location.

    Restart: Restart kubelet (or move the manifest back) to bring etcd up with the restored data
