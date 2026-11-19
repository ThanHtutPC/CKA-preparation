# LEARN: kubeadm Cluster Installation, Configuration and Upgrade

Status: **[EXAM]** core objectives: prepare infrastructure, create and manage clusters with kubeadm, manage the cluster lifecycle, HA control plane.
Version note: commands match kubeadm v1.34/v1.35 on Ubuntu 24.04 with containerd. Items marked **(version-dependent)** must be re-checked on kubernetes.io for your version.

**မြန်မာလို အကျဉ်းချုပ်:** kubeadm သည် Kubernetes cluster ကို စံနည်းနဲ့ bootstrap လုပ်ပေးသော tool ဖြစ်သည်။ Node တိုင်းတွင် (၁) swap ပိတ်၊ (၂) `overlay`/`br_netfilter` module နှင့် sysctl ပြင်၊ (၃) containerd ကို systemd cgroup driver နှင့် သုံး၊ (၄) kubeadm/kubelet/kubectl ထည့်ရမည်။ Control plane တွင် `kubeadm init`၊ CNI ထည့်၊ worker များတွင် `kubeadm join` လုပ်သည်။ Upgrade သည် control plane အရင်၊ worker နောက်၊ minor version တစ်ဆင့်ချင်းသာ ဖြစ်ရမည်။

---

## 1. Learning Objectives

- Prepare Ubuntu nodes for kubeadm and explain why each step is needed.
- Bootstrap a cluster with `kubeadm init` (flags and config file), install a CNI, join workers.
- Read and write a kubeadm configuration file.
- Upgrade a cluster one minor version, node by node, with drain and uncordon.
- Describe how an HA control plane differs (control-plane endpoint, stacked vs external etcd, `--upload-certs`).

## 2. Architecture Overview

```
 apt repo (pkgs.k8s.io, per minor version)
        |
        v   installs on EVERY node:  containerd + kubelet + kubeadm + kubectl
 +-------------+  kubeadm init   +---------------------------------+
 |  cp1        |---------------->| static Pods: apiserver, etcd,   |
 |  (fresh)    |                 | scheduler, controller-manager   |
 +-------------+                 | + CoreDNS, kube-proxy (addons)  |
        | token + CA hash        +---------------------------------+
        v  kubeadm join
 +-------------+  +-------------+       CNI plugin (DaemonSet) gives Pod networking
 |  w1         |  |  w2         |
 +-------------+  +-------------+
```

## 3. Concept Explanation

**kubeadm** automates the "bootstrap" part only. It does not install the OS, the container runtime, a CNI, or manage nodes after creation (except upgrades and certificates).

Responsibilities split:

| Tool | Does |
|------|------|
| You | OS prep, container runtime, CNI choice, load balancer for HA |
| kubeadm | CA and certificates, kubeconfigs, static Pod manifests, bootstrap token, join, upgrade, cert renewal |
| kubelet | Runs the static Pods and everything else on the node |

Version skew rules (check the "Version Skew Policy" page, **version-dependent**):
- `kubeadm` must not be newer than the Kubernetes version it installs; upgrade moves **one minor at a time**.
- kube-apiserver is the reference. kubelet may be older than the API server (up to three minors in recent releases), never newer.
- kubectl may differ from the API server by one minor either way.

## 4. How It Works Internally

`kubeadm init` runs ordered **phases**:

1. **preflight**: checks swap, ports, runtime, kernel settings, required binaries.
2. **certs**: creates the cluster CA, apiserver, kubelet-client, front-proxy, etcd and service-account keys in `/etc/kubernetes/pki`.
3. **kubeconfig**: writes `admin.conf`, `kubelet.conf`, `controller-manager.conf`, `scheduler.conf`.
4. **kubelet-start**: writes `/var/lib/kubelet/config.yaml` and `kubeadm-flags.env`, starts the kubelet.
5. **control-plane**: writes static Pod manifests for apiserver, controller-manager, scheduler in `/etc/kubernetes/manifests`.
6. **etcd**: writes the etcd static Pod manifest (stacked topology).
7. **upload-config**: stores `kubeadm-config` and `kubelet-config` ConfigMaps in `kube-system`.
8. **mark-control-plane**: labels the node `node-role.kubernetes.io/control-plane` and taints it `NoSchedule`.
9. **bootstrap-token** and **addon**: creates the join token machinery, installs CoreDNS and kube-proxy.

`kubeadm join` on a worker: reads the token, uses the CA cert hash to **verify the API server it is talking to** (discovery), performs a TLS bootstrap to obtain a kubelet client certificate via a CSR that is auto-approved, writes `kubelet.conf`, and starts the kubelet.

`kubeadm upgrade apply` (first control plane): checks versions, rewrites static Pod manifests with the new version (the kubelet restarts the components), updates CoreDNS and kube-proxy, renews certs that are about to expire. `kubeadm upgrade node` (other nodes): updates local kubelet config and, on additional control planes, their static Pods.

Tokens expire after 24 hours by default. The CA certificate hash does not expire.

## 5. Important Components

| Item | Location |
|------|----------|
| kubeadm config stored in cluster | ConfigMap `kubeadm-config` in `kube-system` |
| kubelet config | `/var/lib/kubelet/config.yaml`, ConfigMap `kubelet-config` |
| Container runtime socket | `unix:///run/containerd/containerd.sock` |
| containerd config | `/etc/containerd/config.toml` (`SystemdCgroup = true`) |
| CNI binaries / config | `/opt/cni/bin`, `/etc/cni/net.d` |
| Bootstrap tokens | Secrets `bootstrap-token-<id>` in `kube-system` |
| Package pinning | `apt-mark hold kubelet kubeadm kubectl` |

## 6. Real-world Use Cases

- On-prem clusters and labs where no managed service exists.
- Standardised cluster creation in CI (config file in Git, `kubeadm init --config`).
- Rolling cluster upgrades during maintenance windows with drain and uncordon.
- Adding capacity: new node, `kubeadm join` with a fresh token.
- In the CKA exam: nodes are pre-provisioned; you typically add a node, upgrade a node set, or repair a broken component.

## 7. Important Commands

```bash
# Create / join
sudo kubeadm init --config kubeadm-init-config.yaml --upload-certs
sudo kubeadm init --pod-network-cidr=10.244.0.0/16 --apiserver-advertise-address=<IP>   # flag style
kubeadm token create --print-join-command
kubeadm token list
kubeadm token create --ttl 2h
openssl x509 -pubkey -in /etc/kubernetes/pki/ca.crt | openssl rsa -pubin -outform der 2>/dev/null \
  | openssl dgst -sha256 -hex | sed 's/^.* //'          # discovery CA hash

# Config
kubeadm config print init-defaults
kubeadm config print join-defaults
kubeadm config validate --config file.yaml              # (version-dependent: v1.26+)
kubeadm config images list
kubeadm config images pull

# Upgrade
sudo kubeadm upgrade plan
sudo kubeadm upgrade apply v1.35.X
sudo kubeadm upgrade node
apt-cache madison kubeadm

# HA
sudo kubeadm init phase upload-certs --upload-certs
sudo kubeadm join k8s-api:6443 --token T --discovery-token-ca-cert-hash sha256:H \
  --control-plane --certificate-key KEY

# Certs
sudo kubeadm certs check-expiration
sudo kubeadm certs renew all

# Reset a node
sudo kubeadm reset -f
```

## 8. Configuration Examples

Init config used in the lab (`manifests/lab/kubeadm-init-config.yaml`):

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: InitConfiguration
localAPIEndpoint:
  advertiseAddress: 192.168.64.10
  bindPort: 6443
nodeRegistration:
  name: cp1
  criSocket: unix:///run/containerd/containerd.sock
---
apiVersion: kubeadm.k8s.io/v1beta4
kind: ClusterConfiguration
kubernetesVersion: v1.34.0
controlPlaneEndpoint: "k8s-api:6443"
networking:
  podSubnet: 10.244.0.0/16
  serviceSubnet: 10.96.0.0/12
---
apiVersion: kubelet.config.k8s.io/v1beta1
kind: KubeletConfiguration
cgroupDriver: systemd
```

Extra API server SANs and flags go under `ClusterConfiguration.apiServer` (`certSANs`, `extraArgs`). In `v1beta4` `extraArgs` is a list of `name`/`value` pairs, not a map **(version-dependent)**.

A join config file (alternative to flags):

```yaml
apiVersion: kubeadm.k8s.io/v1beta4
kind: JoinConfiguration
discovery:
  bootstrapToken:
    apiServerEndpoint: k8s-api:6443
    token: abcdef.0123456789abcdef
    caCertHashes:
    - sha256:<hash>
nodeRegistration:
  criSocket: unix:///run/containerd/containerd.sock
```

## 9. Common Mistakes

1. Swap still enabled (or re-enabled after reboot because `/etc/fstab` was not edited).
2. `SystemdCgroup` left `false` on Ubuntu 24.04, causing restart loops of control plane Pods.
3. `podSubnet` not matching the CNI's network.
4. Skipping a minor version during upgrade, or upgrading kubelet before `kubeadm upgrade apply`.
5. Forgetting `sudo systemctl daemon-reload && sudo systemctl restart kubelet` after upgrading the kubelet package.
6. Forgetting to `uncordon` after drain.
7. Using an expired token for `join`.
8. Not holding packages, so a routine `apt upgrade` moves the kubelet.
9. Initializing without `controlPlaneEndpoint` and later wanting HA (this cannot be fixed easily afterwards).
10. Running `kubectl` as root without a kubeconfig (`export KUBECONFIG=/etc/kubernetes/admin.conf` works on the control plane).

## 10. Troubleshooting

| Symptom | Check |
|---------|-------|
| init preflight errors | read the error text; fix swap, ports, runtime; do not blindly `--ignore-preflight-errors` |
| API server never comes up after init | `sudo crictl ps -a`, `crictl logs`, `journalctl -u kubelet` |
| Node `NotReady` | kubelet status/journal, containerd status, CNI present |
| CoreDNS Pending | no CNI installed yet |
| join: "unable to fetch cluster-info" | name resolution, port 6443, token expired |
| join: hash mismatch | wrong `--discovery-token-ca-cert-hash` |
| upgrade plan shows nothing | apt repo still points to the old minor |
| kubelet crash after upgrade | `journalctl -u kubelet`, `/var/lib/kubelet/config.yaml`, containerd running |

## 11. Hands-on Lab

Full lab: `labs/lab-01-ubuntu-kubeadm-cluster.md` (build 3-node cluster, join, verify, upgrade, cleanup).

## 12. Lab Verification

Defined in the lab file (nodes Ready, kube-system Pods Running, smoke Deployment reachable, version column updated after upgrade).

## 13. Interview Questions

1. What does `kubeadm init` do, phase by phase?
2. Why must swap be off, and what do `br_netfilter` and `ip_forward` do?
3. Why should the kubelet and containerd both use the systemd cgroup driver?
4. How does `kubeadm join` make sure it talks to the genuine API server?
5. What is the lifetime of a bootstrap token and how do you get a new join command?
6. Why can you not skip a minor version when upgrading?
7. What is the difference between `kubeadm upgrade apply` and `kubeadm upgrade node`?
8. Stacked etcd vs external etcd: trade-offs?
9. What is `--upload-certs`, and how long does the certificate key live?
10. Why `apt-mark hold` on the Kubernetes packages?

## 14. Knowledge Assessment

Answer without notes, then send `REVIEW:` with your answers.

1. List the steps, in order, to upgrade a cluster with one control plane and two workers.
2. A new worker prints "unable to fetch the kubeadm-config ConfigMap" / cannot reach the cluster-info. Name three causes.
3. After `kubeadm init`, `kubectl get nodes` shows `NotReady` and CoreDNS is `Pending`. What is missing?
4. Which file defines the kubelet's cgroup driver, and which file defines containerd's?
5. Which kubeadm command prints the `join` command with a fresh token?
6. What differs when joining an additional **control plane** node compared with a worker?
7. Where do you check certificate expiry on a kubeadm cluster?
8. Why does the lab use a DNS name (`k8s-api`) as `controlPlaneEndpoint` instead of the node IP?

---

### Exam-objective mapping
Domain 1: "Prepare underlying infrastructure", "Create and manage Kubernetes clusters using kubeadm", "Manage the lifecycle of Kubernetes clusters", "Implement and configure a highly-available control plane". Always confirm wording against the current official curriculum.

### Next modules
`LEARN: Node maintenance` then `LEARN: etcd backup and restore`, `LEARN: Certificates and kubeconfig`, `LEARN: RBAC`.
