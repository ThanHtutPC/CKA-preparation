#!/usr/bin/env bash
# FAULT INJECTION for troubleshooting questions.
# SPOILER WARNING: reading this file reveals the fault. Run it without reading.
#
#   sudo bash exam-fault-inject.sh q16   # on cp1
#   sudo bash exam-fault-inject.sh q17   # on w1
#   sudo bash exam-fault-inject.sh m11   # on cp1
set -euo pipefail
[ "$(id -u)" -eq 0 ] || { echo "run with sudo"; exit 1; }

case "${1:-}" in
  q16)
    f=/etc/kubernetes/manifests/kube-scheduler.yaml
    grep -q 'scheduler.conf' "$f" || { echo "pattern not found in $f, fault not applied"; exit 1; }
    sed -i 's#scheduler\.conf#scheduler.config#' "$f"
    echo "Q16 fault applied."
    ;;
  q17)
    applied=0
    for f in /var/lib/kubelet/kubeadm-flags.env /var/lib/kubelet/config.yaml; do
      if [ -f "$f" ] && grep -q 'containerd\.sock' "$f"; then
        sed -i 's#containerd\.sock#containerd.sck#' "$f"; applied=1
      fi
    done
    [ "$applied" -eq 1 ] || { echo "pattern not found, fault not applied"; exit 1; }
    systemctl restart kubelet || true
    echo "Q17 fault applied."
    ;;
  m11)
    f=/etc/kubernetes/manifests/kube-apiserver.yaml
    grep -q 'https://127.0.0.1:2379' "$f" || { echo "pattern not found in $f, fault not applied"; exit 1; }
    sed -i 's#https://127\.0\.0\.1:2379#https://127.0.0.1:2381#' "$f"
    echo "M11 fault applied."
    ;;
  *) echo "usage: $0 q16|q17|m11"; exit 1 ;;
esac
