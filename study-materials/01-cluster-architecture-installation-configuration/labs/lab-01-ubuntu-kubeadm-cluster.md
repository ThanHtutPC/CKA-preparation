# LAB 01: Build a kubeadm cluster on Ubuntu 24.04 (1 control plane + 2 workers), then upgrade it

Status: **[EXAM]** (objectives: prepare infrastructure, create clusters with kubeadm, manage cluster lifecycle).
Version-dependent items are marked **(version-dependent)**. Check them against kubernetes.io docs for your version.

မြန်မာလို အကျဉ်း: ဒီ lab မှာ VM ၃ လုံးနဲ့ cluster တည်ဆောက်ပြီး၊ နောက်ဆုံး minor version တစ်ဆင့် upgrade လုပ်မယ်။ Exam batch 01 နဲ့ mock exam က ဒီ cluster ပေါ်မှာ လုပ်ရမှာမို့ ဒီ lab ကို အရင်လုပ်ပါ။

---

## Lab Objective

1. Prepare three Ubuntu 24.04 nodes (swap, kernel modules, sysctl, containerd with systemd cgroup driver).
2. Install kubeadm, kubelet, kubectl from the versioned `pkgs.k8s.io` repository.
3. Initialize the control plane from a config file, install a CNI, join two workers.
4. Upgrade the cluster by one minor version.

## Prerequisites

- A host machine with about 8 GB free RAM and 60 GB disk (Multipass, VirtualBox or any hypervisor).
- Three Ubuntu 24.04 VMs: `cp1` (2 vCPU, 2 GB RAM min, 3 GB comfortable), `w1`, `w2` (2 vCPU / 2 GB each).
- VMs can reach each other and the internet (apt, pkgs.k8s.io, container registries, GitHub).
- Unique hostname, MAC address and product_uuid on each VM (kubeadm requirement).
- Open ports between nodes: 6443, 2379-2380, 10250, 10257, 10259, 30000-32767 plus CNI traffic. A default Multipass or VirtualBox host-only network has no firewall between VMs, so nothing to open.

## Environment Setup

### Option A: Multipass (host machine)

```bash
multipass launch 24.04 --name cp1 --cpus 2 --memory 3G --disk 20G
multipass launch 24.04 --name w1  --cpus 2 --memory 2G --disk 20G
multipass launch 24.04 --name w2  --cpus 2 --memory 2G --disk 20G
multipass list            # note the three IPv4 addresses
multipass shell cp1       # repeat for w1, w2 in separate terminals
```

### Choose the versions (all nodes)

You install **one minor version below** the newest so that the upgrade part has somewhere to go. This lab assumes `v1.34` then `v1.35`. If a newer minor exists on https://pkgs.k8s.io, shift both numbers up by one and confirm the CKA exam version first (see the README note).

```bash
export K8S_MINOR=v1.34
```

### Name resolution (all three nodes)

Replace the IPs with yours. `k8s-api` is the control-plane endpoint name; defining it now lets you add a second control plane node later (HA question).

```bash
sudo tee -a /etc/hosts <<'EOF'
192.168.64.10 cp1 k8s-api
192.168.64.11 w1
192.168.64.12 w2
EOF
```

## Step-by-step Tasks

### Task 1: Node preparation (run on cp1, w1, w2)

```bash
# 1a. swap off now and permanently
sudo swapoff -a
sudo sed -i '/\sswap\s/ s/^/#/' /etc/fstab

# 1b. kernel modules
cat <<'EOF' | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF
sudo modprobe overlay
sudo modprobe br_netfilter

# 1c. sysctl
cat <<'EOF' | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables  = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward                 = 1
EOF
sudo sysctl --system
```

Why: the kubelet refuses to start with swap on by default; `br_netfilter` lets iptables see bridged Pod traffic (kube-proxy and most CNIs rely on it); `ip_forward` lets the node route Pod traffic.

### Task 2: Container runtime, containerd (all nodes)

```bash
sudo apt-get update
sudo apt-get install -y containerd

sudo mkdir -p /etc/containerd
containerd config default | sudo tee /etc/containerd/config.toml >/dev/null
# Ubuntu 24.04 uses cgroup v2 + systemd, so containerd must use the systemd cgroup driver
sudo sed -i 's/SystemdCgroup = false/SystemdCgroup = true/' /etc/containerd/config.toml
grep SystemdCgroup /etc/containerd/config.toml

sudo systemctl restart containerd
sudo systemctl enable containerd
```

Why: the kubelet is configured for the `systemd` cgroup driver (see the init config). The runtime and kubelet must agree. A mismatch is the classic cause of crash-looping control plane Pods after `kubeadm init`.

### Task 3: kubeadm, kubelet, kubectl (all nodes)

```bash
sudo apt-get install -y apt-transport-https ca-certificates curl gpg
sudo mkdir -p -m 755 /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/${K8S_MINOR}/deb/Release.key \
  | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/${K8S_MINOR}/deb/ /" \
  | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
sudo apt-get install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
sudo systemctl enable --now kubelet
```

Note: the kubelet will restart every few seconds until `kubeadm init` or `join` runs. That is expected.

Optional but useful for the etcd exam tasks (control plane node): `sudo apt-get install -y etcd-client` gives `etcdctl`. The Ubuntu package version is typically 3.4.x. Check with `etcdctl version`. **(version-dependent)** In etcd 3.5+, snapshot restore moved to `etcdutl`.

### Task 4: Initialize the control plane (cp1 only)

Copy the config file from `manifests/lab/kubeadm-init-config.yaml` to cp1, then edit it:

```bash
CP_IP=192.168.64.10                         # your cp1 IP
kubeadm version -o short                    # e.g. v1.34.x
sed -i "s/CP_IP/${CP_IP}/" kubeadm-init-config.yaml
sed -i "s/^kubernetesVersion:.*/kubernetesVersion: $(kubeadm version -o short)/" kubeadm-init-config.yaml

kubeadm config validate --config kubeadm-init-config.yaml
sudo kubeadm init --config kubeadm-init-config.yaml --upload-certs | tee kubeadm-init.log
```

Then set up kubectl for your user:

```bash
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
kubectl get nodes
```

### Task 5: Install a CNI (cp1)

```bash
kubectl apply -f https://github.com/flannel-io/flannel/releases/latest/download/kube-flannel.yml
kubectl -n kube-flannel get pods -w
```

Flannel's default network is `10.244.0.0/16`, which is why the init config uses that `podSubnet`. A different CNI (Calico, Cilium) needs its own CIDR to match. Always compare the CNI manifest's CIDR with `--pod-network-cidr` / `podSubnet`.

### Task 6: Join the workers (w1, w2)

On cp1:

```bash
kubeadm token create --print-join-command
```

Run the printed `sudo kubeadm join k8s-api:6443 --token ... --discovery-token-ca-cert-hash sha256:...` on **w1** and **w2**.

### Task 7: Verify and explore (cp1)

See "Lab Verification" below.

### Task 8: Upgrade one minor version (v1.34 to v1.35 in this lab)

Always: control plane first, then workers one at a time. Skip minor versions is not allowed.
**(version-dependent)** Check "Upgrading kubeadm clusters" on kubernetes.io for your target version before the exam.

**8a. Control plane node (cp1)**

```bash
export NEW_MINOR=v1.35
sudo sed -i "s/${K8S_MINOR}/${NEW_MINOR}/" /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
apt-cache madison kubeadm | head                         # pick the newest patch, e.g. 1.35.x-1.1

sudo apt-mark unhold kubeadm
sudo apt-get install -y kubeadm='1.35.X-*'               # replace X with the patch you picked
sudo apt-mark hold kubeadm

kubeadm version -o short
sudo kubeadm upgrade plan
sudo kubeadm upgrade apply v1.35.X                       # same patch

kubectl drain cp1 --ignore-daemonsets
sudo apt-mark unhold kubelet kubectl
sudo apt-get install -y kubelet='1.35.X-*' kubectl='1.35.X-*'
sudo apt-mark hold kubelet kubectl
sudo systemctl daemon-reload
sudo systemctl restart kubelet
kubectl uncordon cp1
```

**8b. Each worker (w1, then w2)**

On the worker:

```bash
export K8S_MINOR=v1.34; export NEW_MINOR=v1.35
sudo sed -i "s/${K8S_MINOR}/${NEW_MINOR}/" /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update
sudo apt-mark unhold kubeadm
sudo apt-get install -y kubeadm='1.35.X-*'
sudo apt-mark hold kubeadm
sudo kubeadm upgrade node
```

On cp1:

```bash
kubectl drain w1 --ignore-daemonsets
```

Back on the worker:

```bash
sudo apt-mark unhold kubelet kubectl
sudo apt-get install -y kubelet='1.35.X-*' kubectl='1.35.X-*'
sudo apt-mark hold kubelet kubectl
sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

On cp1:

```bash
kubectl uncordon w1
```

Repeat for w2.

## Required YAML files

- `manifests/lab/kubeadm-init-config.yaml` (provided in this repo; edit `CP_IP` and `kubernetesVersion`).
- CNI manifest: downloaded from the Flannel release URL in Task 5.

## Expected Output (what you should observe, not literal text)

- Task 4: `kubeadm init` finishes with a message that the control plane initialized successfully and prints `kubeadm join` instructions. Preflight warnings about swap/cgroup mean Task 1 or 2 was missed.
- After Task 4, before the CNI: `kubectl get nodes` shows `cp1` as `NotReady`, CoreDNS Pods `Pending`.
- After Task 5: `cp1` becomes `Ready`; CoreDNS Pods reach `Running`.
- After Task 6: three nodes, all `Ready`. Workers show `<none>` under ROLES, which is normal.
- After Task 8: the VERSION column shows the new version on every node. All kube-system Pods are `Running`.

## Lab Verification

```bash
kubectl get nodes -o wide                         # 3 nodes Ready, containerd runtime shown
kubectl get pods -A -o wide                       # kube-system, kube-flannel all Running
kubectl -n kube-system get cm kubeadm-config -o yaml | grep -E 'kubernetesVersion|controlPlaneEndpoint|podSubnet'
kubectl get --raw='/readyz?verbose' | tail -n 3
ls /etc/kubernetes/manifests                      # on cp1: 4 static Pod manifests
sudo kubeadm certs check-expiration               # on cp1: all certs with future expiry

# cluster works end to end
kubectl create deployment smoke --image=nginx --replicas=3
kubectl get pods -l app=smoke -o wide             # Pods spread over w1/w2 and reach Running
kubectl expose deployment smoke --port=80
kubectl run curl --rm -it --image=busybox:1.36 --restart=Never -- wget -qO- smoke
```

## Troubleshooting this lab

| Symptom | Check |
|---------|-------|
| `kubeadm init` preflight fails on swap | `swapon --show`, Task 1a |
| Control plane Pods crash-loop after init | `sudo crictl ps -a`, `sudo journalctl -u kubelet`; verify `SystemdCgroup = true` and restart containerd |
| `crictl` warns about endpoints | create `/etc/crictl.yaml` with `runtime-endpoint: unix:///run/containerd/containerd.sock` |
| Node stays `NotReady` | CNI Pods in `kube-flannel`, `/etc/cni/net.d`, `br_netfilter` loaded |
| Flannel Pods crash | podSubnet does not match the Flannel network; `kubectl -n kube-flannel logs <pod>` |
| `join` fails on token | token expired (24 h default); create a new one |
| `join` fails TLS/connect | `/etc/hosts` entry for `k8s-api`, port 6443 reachable from the worker |
| `kubectl` says connection refused after VM reboot | `systemctl status kubelet`; swap came back (fstab line not commented) |

## Cleanup

Reset a node (run on each node you want to wipe):

```bash
sudo kubeadm reset -f
sudo rm -rf /etc/cni/net.d $HOME/.kube
sudo iptables -F && sudo iptables -t nat -F && sudo iptables -t mangle -F && sudo iptables -X
```

Delete the VMs when finished:

```bash
multipass delete cp1 w1 w2 && multipass purge
```

Tip: before starting the exam batch, stop the VMs and take a snapshot so you can roll back (the etcd restore and upgrade questions change the cluster heavily). With Multipass: `multipass stop cp1 w1 w2`, `multipass snapshot cp1 --name clean-v134` (repeat per VM; needs a recent Multipass release), then `multipass start`.
