# LEARN: Kubernetes Architecture

Status: **[SUPP]** foundation. Not a standalone exam objective, but every Domain 1 task (kubeadm, upgrades, etcd, HA) assumes it.
Version note: commands target Kubernetes v1.35-era kubeadm clusters on Ubuntu 24.04 with containerd. Verify flags with `--help` on your installed version.

---

## 1. Learning Objectives

After this module you can:
- Name every control plane and node component and state what it does and what it talks to.
- Trace what happens from `kubectl apply` to a running container.
- Locate each component's manifest, config, certificates and logs on a kubeadm cluster.
- Check component health and find a failing component quickly.

## 2. Architecture Overview

```
                      +-------------------- Control Plane ---------------------+
 kubectl / clients -->|  kube-apiserver  <--->  etcd (cluster state)           |
                      |       ^   ^                                            |
                      |       |   +-- kube-scheduler (assigns Pods to nodes)   |
                      |       +------ kube-controller-manager (reconcilers)    |
                      |       +------ cloud-controller-manager (cloud only)    |
                      +-------|----------------------------------------------- +
                              | (all components talk ONLY to the API server,
                              |  except the API server talking to etcd/kubelet)
        +---------------------|-------------------+   +----- Worker Node 2 ----+
        |  Worker Node 1      v                   |   | kubelet, kube-proxy,   |
        |  kubelet <-> container runtime (CRI)    |   | containerd, CNI plugin |
        |  kube-proxy (Service rules)             |   +------------------------+
        |  CNI plugin (Pod networking)            |
        |  Pods: [app containers]                 |
        +-----------------------------------------+
```

Key rule: **the API server is the only component that reads and writes etcd.** Everything else watches and updates objects through the API server.

## 3. Concept Explanation

| Component | Where it runs (kubeadm) | Role |
|-----------|------------------------|------|
| kube-apiserver | static Pod on control plane | REST front door: authN, authZ, admission, validation, persistence to etcd, watch streams |
| etcd | static Pod (stacked) | Consistent key-value store holding all cluster state |
| kube-scheduler | static Pod | Picks a node for each unscheduled Pod (filter, then score) |
| kube-controller-manager | static Pod | Runs controllers (Deployment, ReplicaSet, Node, Job, Endpoints, ServiceAccount, etc.) that drive actual state toward desired state |
| cloud-controller-manager | only with a cloud provider | Cloud-specific loops (load balancers, node lifecycle) |
| kubelet | **systemd service** on every node | Node agent: runs Pods assigned to its node, reports status, runs probes, talks to the runtime via CRI |
| kube-proxy | DaemonSet | Programs Service virtual IP rules (iptables or IPVS mode) on each node |
| Container runtime | systemd service (containerd) | Pulls images, runs containers via CRI |
| CNI plugin | DaemonSet + binaries in `/opt/cni/bin` | Pod network (IP assignment, routing) |
| CoreDNS | Deployment | Cluster DNS |

Important distinction: **kubelet and containerd are systemd services; the control plane components are static Pods managed by the kubelet.**

## 4. How It Works Internally

**Flow of `kubectl create deployment web --image=nginx --replicas=2`:**
1. kubectl sends an authenticated HTTPS request to the API server.
2. API server runs authentication, authorization (RBAC), admission controllers, validates, and writes the Deployment to etcd.
3. The Deployment controller (in controller-manager) sees the new Deployment via watch and creates a ReplicaSet.
4. The ReplicaSet controller creates 2 Pod objects (no node assigned yet).
5. The scheduler sees Pods with empty `spec.nodeName`, filters and scores nodes, and writes a binding (sets `nodeName`).
6. The kubelet on the chosen node sees a Pod assigned to it, calls the runtime (CRI) to pull the image and start containers, and calls CNI for networking.
7. The kubelet reports Pod status back to the API server, which stores it in etcd.

**Static Pods:** the kubelet watches a directory (`staticPodPath`, `/etc/kubernetes/manifests` in kubeadm) and runs any Pod manifest found there without the API server. It creates read-only "mirror Pods" so they appear in `kubectl get pods -n kube-system`. This is why editing a file in that directory changes a control plane component, and why you cannot fix a static Pod with `kubectl edit`.

**Control loop (reconciliation):** controllers compare desired state (spec) to observed state (status) and act to close the gap, continuously.

**Leader election:** with multiple control plane nodes, scheduler and controller-manager run on every control plane node but only one instance is active at a time (a Lease object holds leadership). The API server instances are all active.

## 5. Important Components: files and ports on a kubeadm control plane node

| Item | Path / port |
|------|-------------|
| Static Pod manifests | `/etc/kubernetes/manifests/` (`kube-apiserver.yaml`, `etcd.yaml`, `kube-scheduler.yaml`, `kube-controller-manager.yaml`) |
| Certificates | `/etc/kubernetes/pki/` (etcd certs in `pki/etcd/`) |
| Admin kubeconfig | `/etc/kubernetes/admin.conf` |
| Component kubeconfigs | `/etc/kubernetes/{controller-manager,scheduler,kubelet}.conf` |
| kubelet config | `/var/lib/kubelet/config.yaml`; flags env `/var/lib/kubelet/kubeadm-flags.env` |
| API server | 6443/tcp |
| etcd | 2379 (client), 2380 (peer) |
| kubelet API | 10250 |
| scheduler / controller-manager secure ports | 10259 / 10257 |
| etcd data dir | `/var/lib/etcd` |

## 6. Real-world Use Cases

- **Why the scheduler is down:** new Pods stay `Pending` with no events from the scheduler, while existing Pods keep running.
- **Why the controller-manager is down:** Deployments do not create ReplicaSets or replace failed Pods; scaling does nothing.
- **Why the API server is down:** `kubectl` fails with connection refused, but running workloads keep running.
- **Why etcd matters:** losing etcd without a backup means losing all cluster objects (workloads on nodes keep running briefly but can no longer be managed).

## 7. Important Commands

```bash
kubectl cluster-info
kubectl get nodes -o wide
kubectl get pods -n kube-system -o wide
kubectl get --raw='/readyz?verbose'          # API server readiness checks
kubectl get --raw='/livez?verbose'
kubectl api-resources                         # all resource kinds, shortnames, namespaced?
kubectl api-resources --namespaced=false
kubectl api-versions
kubectl explain pod.spec.containers --recursive | less
kubectl describe node <node>

# On a node (host level)
systemctl status kubelet
journalctl -u kubelet -f --no-pager
systemctl status containerd
sudo crictl ps -a                             # containers via CRI (needs runtime endpoint configured)
sudo crictl pods
sudo crictl logs <container-id>
```

`crictl` needs a runtime endpoint. If it warns about a default endpoint, set `/etc/crictl.yaml` with `runtime-endpoint: unix:///run/containerd/containerd.sock`.

Static Pod / manifest inspection:
```bash
ls /etc/kubernetes/manifests
sudo grep -E 'image:|--' /etc/kubernetes/manifests/kube-apiserver.yaml
```

## 8. Configuration Examples

A minimal static Pod (place in `/etc/kubernetes/manifests/` on any node to run it; the kubelet picks it up automatically):

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: static-web
  namespace: default
spec:
  containers:
  - name: web
    image: nginx:1.27
    ports:
    - containerPort: 80
```

The Pod appears as `static-web-<nodename>` in `kubectl get pods`. Delete it by removing the file, not with `kubectl delete`.

Where the kubelet's static Pod path is defined (check, do not assume):
```bash
sudo grep staticPodPath /var/lib/kubelet/config.yaml
```

## 9. Common Mistakes

1. Trying to `kubectl delete` a static Pod and expecting it to stay gone (the kubelet recreates it).
2. Editing a manifest in `/etc/kubernetes/manifests` with a typo, causing that control plane component to crash-loop (the API server may disappear, so `kubectl` stops working; use `crictl` and the kubelet journal).
3. Confusing kubelet (systemd service) with control plane components (static Pods).
4. Forgetting that the scheduler only assigns; the kubelet runs. A Pod with `nodeName` set manually bypasses the scheduler.
5. Assuming `kubectl get componentstatuses` is reliable. It is deprecated; use `/livez` and `/readyz` and check the Pods.
6. Running `kubectl` as root on a node with no kubeconfig set (`KUBECONFIG` or `~/.kube/config`).

## 10. Troubleshooting

| Symptom | First checks |
|---------|--------------|
| `kubectl` connection refused to :6443 | `crictl ps -a \| grep kube-apiserver`, `journalctl -u kubelet`, manifest typo, etcd down, expired certs |
| Node `NotReady` | `systemctl status kubelet`, `journalctl -u kubelet`, `systemctl status containerd`, CNI installed? swap enabled? |
| Pods stuck `Pending`, no scheduling events | `kubectl -n kube-system get pods` for the scheduler; its logs; taints/resources if the scheduler is healthy |
| Deployment does not create Pods | controller-manager Pod status and logs |
| Static Pod not starting | `journalctl -u kubelet` for YAML errors; check `staticPodPath` |
| Control plane Pod crash-loop | `sudo crictl ps -a`, then `sudo crictl logs <id>` (works when the API server is down) |

Logs for control plane components when the API server is up: `kubectl -n kube-system logs <pod>`. When it is down, use `crictl logs` or `/var/log/pods/` and `/var/log/containers/`.

## 11. Hands-on Lab

### Lab Objective
Identify and break/fix control plane components on a kubeadm cluster, and run a static Pod.

### Prerequisites
A running kubeadm cluster (1 control plane + at least 1 worker), `kubectl` access from the control plane node, sudo access. If you do not have a cluster yet, build one after `LEARN: kubeadm cluster installation`; you can read this lab first.

### Environment Setup
SSH to the control plane node (`cp1`). Confirm: `kubectl get nodes`.

### Step-by-step Tasks
1. List nodes and all kube-system Pods; note which Pods are static (names end with the node name) and which are DaemonSet/Deployment managed.
2. Print the kubelet's static Pod path and list the manifests directory.
3. Find the image version used by the API server from its manifest.
4. Query `/readyz?verbose` on the API server.
5. Create the static Pod from section 8 on the **worker** node: SSH to `w1`, write the YAML into the static Pod path (use the path you found in step 2), and confirm it appears from `cp1`.
6. Break the scheduler safely: on `cp1`, move `kube-scheduler.yaml` out of the manifests directory into `/tmp`. Create a Deployment `lab-web` (nginx, 2 replicas) and observe the Pods. Restore the manifest and observe recovery.
7. Find the scheduler container through `crictl` while the file is moved.

### Required YAML files
- `manifests/architecture/static-web.yaml` (section 8 content).

### Commands
```bash
# 1
kubectl get nodes -o wide
kubectl get pods -n kube-system -o wide
# 2
sudo grep staticPodPath /var/lib/kubelet/config.yaml
ls /etc/kubernetes/manifests
# 3
sudo grep image: /etc/kubernetes/manifests/kube-apiserver.yaml
# 4
kubectl get --raw='/readyz?verbose'
# 5 (on w1, as root)
sudo cp static-web.yaml /etc/kubernetes/manifests/
# back on cp1
kubectl get pods -o wide
# 6
sudo mv /etc/kubernetes/manifests/kube-scheduler.yaml /tmp/
kubectl create deployment lab-web --image=nginx --replicas=2
kubectl get pods -l app=lab-web
kubectl describe pod -l app=lab-web | tail -n 20
sudo mv /tmp/kube-scheduler.yaml /etc/kubernetes/manifests/
kubectl get pods -l app=lab-web -w
# 7
sudo crictl ps -a | grep kube-scheduler
```

### Expected Output
Output depends on your cluster, so exact text is not reproduced here. What you should observe:
- Step 1: control plane Pods named `<component>-<nodename>`; kube-proxy and CNI Pods named with random suffixes.
- Step 4: a list of checks each ending in `ok`, and the final line reporting overall readiness.
- Step 5: Pod `static-web-w1` appears in `default`, status Running after the image pull.
- Step 6: while the scheduler manifest is absent, `lab-web` Pods stay `Pending` with no scheduling events; after restoring the file they get assigned and start.

### Lab Verification
```bash
kubectl get pods -n kube-system | grep -E 'apiserver|scheduler|controller|etcd'
kubectl get pods -l app=lab-web -o wide        # Running, nodeName populated
kubectl get pod static-web-w1
```

### Cleanup
```bash
kubectl delete deployment lab-web
# on w1:
sudo rm /etc/kubernetes/manifests/static-web.yaml
# confirm scheduler manifest is back on cp1:
ls /etc/kubernetes/manifests
```

## 12. Interview Questions

1. Which components does the API server talk to, and which talk to etcd?
2. Why do control plane components run as static Pods in kubeadm clusters?
3. Describe what happens between `kubectl apply` and a container starting.
4. What happens to running Pods if the control plane goes down?
5. Difference between kubelet and kube-proxy?
6. What is a mirror Pod?
7. How do the scheduler and controller-manager avoid conflicting when HA is enabled?
8. What is CRI, and how does the kubelet use it?

## 13. Knowledge Assessment

Answer without notes, then check against sections above (type `REVIEW:` with your answers for scoring).

1. On a kubeadm node, where do control plane manifests live, and who reads them?
2. A Deployment's Pods are `Pending` and `kubectl describe pod` shows no events. Which component is the first suspect?
3. `kubectl` returns "connection refused" on 6443. Name three things you would check, in order, and the tool you use when the API server is down.
4. Which control plane components are active on all control plane nodes in an HA cluster, and which are leader-elected?
5. True or false: deleting a static Pod with `kubectl delete pod` removes it permanently.
6. Which port does etcd use for client traffic, and which for peer traffic?
7. Why is `kubectl get componentstatuses` discouraged, and what replaces it?

---

### Exam-objective mapping
Supports Domain 1 objectives: create and manage clusters using kubeadm; manage cluster lifecycle; HA control plane. Also directly useful for the Troubleshooting domain (30% on the current curriculum per sources).

### Next module
`LEARN: Infrastructure preparation and containerd` (swap, kernel modules, sysctl, cgroup driver), then `LEARN: kubeadm cluster installation`.
