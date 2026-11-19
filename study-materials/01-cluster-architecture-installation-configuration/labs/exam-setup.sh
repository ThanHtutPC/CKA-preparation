#!/usr/bin/env bash
# Seeds the lab cluster for the exam sets. Safe to re-run (uses dry-run | apply).
# Run on cp1 as a sudo-capable user with a working kubectl.
#
#   bash exam-setup.sh b01      # seeds for 02-exam-practice batch 01
#   bash exam-setup.sh q15      # run ONLY when Q15 tells you to (after you finished Q6)
#   bash exam-setup.sh m01      # seeds for 03-mock-exams mock 01
#
# Assumes node names cp1, w1, w2 and a Kubernetes lab built from labs/lab-01-ubuntu-kubeadm-cluster.md
set -euo pipefail

W1="${W1:-w1}"
OWNER="$(id -un)"
mkdir_exam() { sudo mkdir -p "$1" && sudo chown -R "$OWNER":"$OWNER" "$1"; }
ns() { kubectl create namespace "$1" --dry-run=client -o yaml | kubectl apply -f -; }

b01() {
  ns dev
  ns shop

  # Q1
  kubectl -n dev create serviceaccount ci-bot --dry-run=client -o yaml | kubectl apply -f -

  # Q3
  kubectl -n shop create deployment web --image=nginx:1.27 --replicas=4 \
    --dry-run=client -o yaml | kubectl apply -f -

  # Q4
  mkdir_exam /opt/exam/q4
  sudo cp /etc/kubernetes/admin.conf /opt/exam/q4/kubeconfig
  sudo chown "$OWNER":"$OWNER" /opt/exam/q4/kubeconfig

  # Q8
  mkdir_exam /opt/exam/q8/base
  cat > /opt/exam/q8/base/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
  labels:
    app: webapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: webapp
  template:
    metadata:
      labels:
        app: webapp
    spec:
      containers:
      - name: webapp
        image: nginx:1.25
        ports:
        - containerPort: 80
EOF
  cat > /opt/exam/q8/base/service.yaml <<'EOF'
apiVersion: v1
kind: Service
metadata:
  name: webapp
  labels:
    app: webapp
spec:
  selector:
    app: webapp
  ports:
  - port: 80
    targetPort: 80
EOF
  cat > /opt/exam/q8/base/kustomization.yaml <<'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
- service.yaml
EOF

  # output directories for the other questions
  for q in q5 q6 q7 q9 q10 q11 q12 q13 q14 q15 q16 q17 q18 q19 q20; do mkdir_exam "/opt/exam/$q"; done
  mkdir_exam /opt/backup
  echo "Batch 01 seeded. Output directories created under /opt/exam."
}

q15() {
  ns payments
  kubectl -n payments create deployment ledger --image=nginx:1.27 --replicas=2 \
    --dry-run=client -o yaml | kubectl apply -f -
  echo "Q15 seed created (namespace payments)."
}

m01() {
  mkdir_exam /opt/exam
  for q in m1 m2 m3 m4 m5 m6 m7 m8 m9 m10 m11 m12 m13 m14 m15; do mkdir_exam "/opt/exam/$q"; done

  # M5
  ns m5
  kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cache
  namespace: m5
spec:
  replicas: 4
  selector:
    matchLabels:
      app: cache
  template:
    metadata:
      labels:
        app: cache
    spec:
      containers:
      - name: cache
        image: busybox:1.36
        command: ["sh","-c","sleep 3600"]
        volumeMounts:
        - name: scratch
          mountPath: /scratch
      volumes:
      - name: scratch
        emptyDir: {}
---
apiVersion: v1
kind: Pod
metadata:
  name: lonely
  namespace: m5
spec:
  nodeSelector:
    kubernetes.io/hostname: ${W1}
  containers:
  - name: lonely
    image: busybox:1.36
    command: ["sh","-c","sleep 3600"]
EOF

  # M6 base
  mkdir_exam /opt/exam/m6/base
  cat > /opt/exam/m6/base/deployment.yaml <<'EOF'
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels:
    app: api
spec:
  replicas: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: nginx:1.25
        envFrom:
        - configMapRef:
            name: api-config
EOF
  cat > /opt/exam/m6/base/kustomization.yaml <<'EOF'
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
resources:
- deployment.yaml
configMapGenerator:
- name: api-config
  literals:
  - LOG_LEVEL=info
  - REGION=lab
EOF

  # M7 local chart + two releases
  if command -v helm >/dev/null; then
    rm -rf /opt/exam/m7/chart
    helm create /opt/exam/m7/chart >/dev/null
    ns m7a; ns m7b
    helm upgrade --install alpha /opt/exam/m7/chart -n m7a
    helm upgrade --install beta  /opt/exam/m7/chart -n m7b
  else
    echo "WARNING: helm not installed; M7 seed skipped. Install Helm first, then re-run."
  fi
  echo "Mock 01 seeded."
}

case "${1:-}" in
  b01) b01 ;;
  q15) q15 ;;
  m01) m01 ;;
  *) echo "usage: $0 b01|q15|m01"; exit 1 ;;
esac
