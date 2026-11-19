# MOCK EXAM 01: Cluster Architecture, Installation & Configuration

- Format: 15 hands-on tasks, **120 minutes**, weighted to 100%. Passing line used in the real CKA is 66% overall; use the same bar here.
- Question language English. Explanations (SOLUTION mode) in Burmese. Answers hidden.
- Allowed: kubernetes.io docs, Helm docs, `kubectl explain`, `--help`. Nothing else (no notes, no other sites).
- Set a timer. Skip and return if stuck for more than the estimate. Partial credit exists in the real exam.

## Setup

1. Restore all VMs to the clean snapshot (see lab file) so earlier batches do not interfere.
2. Cluster: `cp1`, `w1`, `w2` from `labs/lab-01-ubuntu-kubeadm-cluster.md`, built at the older minor version.
3. On cp1: `bash labs/exam-setup.sh m01` (needs Helm installed).
4. Extra profiles (use another set of VMs, or rebuild with snapshots):

| Profile | Used by | Meaning |
|---------|---------|---------|
| STD | most | the 3-node cluster |
| NOCNI | M3 | a freshly initialised cluster (`kubeadm init` with `--pod-network-cidr=192.168.0.0/16` or the matching config field, 1 control plane + 1 worker joined) with **no CNI installed**, nodes NotReady |
| UPG | M10 | cluster at the older minor, control plane not yet upgraded |

If you cannot run NOCNI or UPG simultaneously, do M3/M10 last on rebuilt clusters and count the time anyway.

Result files go under `/opt/exam/m<number>/` (created by the seed script).

## Scoring table

| Q | Topic | Weight | Time |
|---|-------|--------|------|
| M1 | RBAC namespaced | 6% | 6 |
| M2 | kubeadm config file | 7% | 8 |
| M3 | CNI installation | 8% | 10 |
| M4 | etcd inspect + snapshot | 7% | 8 |
| M5 | Node maintenance | 5% | 6 |
| M6 | Kustomize | 7% | 9 |
| M7 | Helm releases | 6% | 8 |
| M8 | CRD with validation | 8% | 10 |
| M9 | Certificates | 6% | 7 |
| M10 | kubeadm upgrade | 10% | 14 |
| M11 | Troubleshooting API server | 9% | 10 |
| M12 | Aggregated ClusterRole | 6% | 7 |
| M13 | ServiceAccount kubeconfig | 4% | 5 |
| M14 | HA control plane preparation | 5% | 6 |
| M15 | Extension interfaces | 6% | 6 |
| | **Total** | **100%** | **120** |

---

## M1 | Intermediate | 6 min | 6%

**Scenario:** The release bot `release-bot` in namespace `staging` must manage Deployments in that namespace, but nothing outside it.

**Task:** Create the ServiceAccount and the minimal RBAC for it.

**Requirements:**
- Namespace `staging` (create if missing), ServiceAccount `release-bot`.
- Role `deploy-manager`: create, get, list, update, patch on Deployments (apps group) and read access (get, list) to Pods. No delete anywhere.
- RoleBinding `release-bot-deploy-manager`.
- Write three authorization test results to `/opt/exam/m1/checks.txt`, each line describing the test and its answer: create Deployments in `staging`; delete Deployments in `staging`; list Pods in `default`.

**Namespace / Node / Resource info:** `staging`.

**Expected final state:** the checks read yes / no / no.

---

## M2 | Advanced | 8 min | 7% | STD

**Scenario:** You are preparing the configuration of a new cluster that will be created later.

**Task:** Write a kubeadm configuration file for the new cluster.

**Requirements:**
- Path: `/opt/exam/m2/kubeadm-config.yaml`; one multi-document file using the API version that your installed kubeadm uses.
- Kubernetes version equal to your installed kubeadm version.
- Node name `cp-lab`, CRI socket for containerd.
- Pod network `10.200.0.0/16`, Service network `10.50.0.0/16`.
- Control-plane endpoint `k8s-api:6443`; API server certificate must additionally be valid for `k8s-api` and `192.0.2.10`.
- kubelet cgroup driver `systemd`; kube-proxy in `ipvs` mode.
- The file must be accepted by kubeadm's own validation.

**Namespace / Node / Resource info:** No cluster change. Node `cp1` has the tooling.

**Expected final state:** the file passes validation without errors or deprecation warnings that you can avoid.

---

## M3 | Intermediate | 10 min | 8% | NOCNI

**Scenario:** A new cluster has just been initialised. Nodes are `NotReady` and CoreDNS is `Pending`.

**Task:** Install a CNI that supports NetworkPolicy and make the cluster usable.

**Requirements:**
- Use Calico (follow the official Calico documentation) with a Pod CIDR consistent with the cluster's configured Pod network.
- Do not re-initialise the cluster.
- Create a Deployment `net-test` (nginx, 2 replicas, in `default`) afterwards, forcing its two Pods onto different nodes.
- Save the Pod IPs and node names (`-o wide` output) to `/opt/exam/m3/pods.txt`.

**Namespace / Node / Resource info:** All nodes; namespace `default`.

**Expected final state:** all nodes Ready; CoreDNS Running; both `net-test` Pods Running on different nodes with IPs from the cluster Pod CIDR.

---

## M4 | Intermediate | 8 min | 7% | STD

**Scenario:** You must document the state of etcd before maintenance and take a backup.

**Task:** Inspect etcd and take a snapshot.

**Requirements:**
- Write the member list (ID, name, peer and client URLs) to `/opt/exam/m4/members.txt`.
- Write the endpoint health check result to `/opt/exam/m4/health.txt`.
- Write the **version of the etcd image** used by the cluster to `/opt/exam/m4/version.txt` (just the tag).
- Save a snapshot to `/opt/backup/m4-etcd.db` and verify it is readable.

**Namespace / Node / Resource info:** Node `cp1`.

**Expected final state:** the four outputs exist and the snapshot passes verification.

---

## M5 | Intermediate | 6 min | 5% | STD (after seed)

**Scenario:** `w1` must be rebooted. Namespace `m5` holds the Deployment `cache` (4 replicas, uses `emptyDir`) and a standalone Pod `lonely` that is pinned to `w1` and has no controller.

**Task:** Evacuate `w1` safely.

**Requirements:**
- No workload Pods may remain on `w1` (DaemonSet Pods may).
- The Deployment's Pods must be running on other nodes.
- `lonely` must be **running again on a different node** when you are done.
- Leave `w1` unschedulable at the end (the reboot is done later).

**Namespace / Node / Resource info:** Node `w1`, namespace `m5`.

**Expected final state:** `kubectl get pods -n m5 -o wide` shows all five Pods Running, none on `w1`; `w1` is `Ready,SchedulingDisabled`.

---

## M6 | Intermediate | 9 min | 7% | STD (after seed)

**Scenario:** `/opt/exam/m6/base` contains a Deployment `api` and a generated ConfigMap `api-config`.

**Task:** Create a `staging` overlay at `/opt/exam/m6/overlays/staging` and apply it.

**Requirements:**
- Namespace `m6-staging` (create it); name suffix `-stg` on all resources.
- Replicas 2; image `nginx:1.27`.
- The generated ConfigMap must have `LOG_LEVEL=debug` (overriding the base) and an additional key `FEATURE_X=on`.
- The container must have resource limits `cpu: 200m`, `memory: 128Mi`.
- Do not edit files in `base`.
- Apply with kubectl's built-in Kustomize.

**Namespace / Node / Resource info:** Namespace `m6-staging`.

**Expected final state:** Deployment `api-stg` 2/2 Available with the limits and image; the Pods get the ConfigMap values (verify one Pod's environment); base unchanged.

---

## M7 | Intermediate | 8 min | 6% | STD (after seed)

**Scenario:** Two releases (`alpha` in `m7a`, `beta` in `m7b`) were installed from the chart in `/opt/exam/m7/chart`.

**Task:** Inspect, change and clean up Helm releases.

**Requirements:**
- Write the release name, namespace and status of **all** releases in the cluster (every namespace) to `/opt/exam/m7/releases.txt`.
- Write the manifests that the chart would generate with `replicaCount=2` (without installing) to `/opt/exam/m7/rendered.yaml`.
- Upgrade `alpha` with a values file `/opt/exam/m7/values.yaml` that you create, setting `replicaCount: 2`.
- Remove release `beta` completely.

**Namespace / Node / Resource info:** Namespaces `m7a`, `m7b`.

**Expected final state:** `alpha` has 2 replicas and revision 2; `beta` no longer exists; the three files exist.

---

## M8 | Advanced | 10 min | 8% | STD

**Scenario:** A team wants a `Widget` resource whose fields are validated by the API server.

**Task:** Define the CRD and prove the validation works.

**Requirements:**
- Group `lab.example.com`, version `v1`, kind `Widget`, plural `widgets`, namespaced.
- `spec.size`: required string, allowed values `small`, `medium`, `large`.
- `spec.replicas`: integer between 1 and 10.
- Create a valid `Widget` named `w-ok` in namespace `default`.
- Try to create an invalid `Widget` (size `huge`) and write the server's rejection message to `/opt/exam/m8/rejection.txt`.

**Namespace / Node / Resource info:** Namespace `default`.

**Expected final state:** `w-ok` exists; `huge` object does not exist; the rejection file shows a validation error mentioning the allowed values.

---

## M9 | Intermediate | 7 min | 6% | STD

**Scenario:** A security review asks four questions about the control plane's certificates.

**Task:** Answer them with files.

**Requirements (one file each under `/opt/exam/m9/`):**
- `apiserver-sans.txt`: all DNS names and IP addresses in the API server's serving certificate.
- `etcd-expiry.txt`: expiry date of the etcd **server** certificate.
- `issuer.txt`: the issuer (subject of the signing CA) of the API server's serving certificate.
- `ca-lifetime.txt`: the expiry date of the cluster CA certificate itself.

**Namespace / Node / Resource info:** Node `cp1`.

**Expected final state:** four files with correct values.

---

## M10 | Advanced | 14 min | 10% | UPG

**Scenario:** The cluster is one minor version behind. You are asked to upgrade **only the control plane node** in this window; workers follow later.

**Task:** Upgrade `cp1` to the next minor version.

**Requirements:**
- Record what the upgrade plan reports (before you change anything) in `/opt/exam/m10/plan.txt`.
- Upgrade the control plane components and the node's kubelet and kubectl to the same patch release.
- Keep the control plane node schedulable for workloads only as it was before (control-plane taint unchanged); it must not be left cordoned.
- Workers stay at the old version and must remain `Ready`.
- Packages stay protected against accidental upgrades.

**Namespace / Node / Resource info:** Node `cp1`.

**Expected final state:** `cp1` Ready at the new version; `w1`, `w2` Ready at the old version; all kube-system Pods Running.

---

## M11 | Advanced | 10 min | 9% | STD

**Scenario:** After a configuration change, `kubectl` stops working.

**Task:** Run `sudo bash labs/exam-fault-inject.sh m11` on `cp1` **without reading the script**, then restore the cluster.

**Requirements:**
- `kubectl` is unavailable while the fault exists. Diagnose with node-level tools only.
- Save the line from the failing component's log that shows the cause to `/opt/exam/m11/evidence.txt`.
- Fix the cause in place; do not re-initialise the cluster.

**Namespace / Node / Resource info:** Node `cp1`.

**Expected final state:** `kubectl get nodes` works again; all control plane Pods Running; the evidence file holds the relevant log line.

---

## M12 | Intermediate | 7 min | 6% | STD

**Scenario:** The monitoring stack ServiceAccount `prom` (namespace `monitoring`) needs read access to Pods and Nodes cluster-wide. The team wants permissions to be added later by labelling small roles, without editing the main role.

**Task:** Build this with aggregation.

**Requirements:**
- Create the namespace and ServiceAccount.
- Two ClusterRoles: `monitoring-pods` (get, list, watch Pods) and `monitoring-nodes` (get, list, watch Nodes), both labelled `rbac.lab.io/aggregate-to-monitoring: "true"`.
- A ClusterRole `monitoring` that automatically collects every ClusterRole carrying that label.
- A ClusterRoleBinding `prom-monitoring` for `prom` to `monitoring`.
- Save, to `/opt/exam/m12/rules.txt`, the effective rules of `monitoring` (proving aggregation happened).

**Namespace / Node / Resource info:** Namespace `monitoring`, cluster-scoped roles.

**Expected final state:** `prom` can list Pods in any namespace and list Nodes, but cannot list Secrets.

---

## M13 | Intermediate | 5 min | 4% | STD

**Scenario:** A CI system outside the cluster needs a kubeconfig for the ServiceAccount `ci-reader` in namespace `m13`.

**Task:** Create the identity and its kubeconfig.

**Requirements:**
- Namespace `m13`; ServiceAccount `ci-reader`; permission to get and list Pods in `m13` only.
- Kubeconfig `/opt/exam/m13/ci-reader.conf`: cluster entry `lab` (API server address and embedded CA), user `ci-reader` authenticated with a token valid for 1 hour, context `ci` with default namespace `m13`, current context `ci`.

**Namespace / Node / Resource info:** Namespace `m13`.

**Expected final state:** `kubectl --kubeconfig /opt/exam/m13/ci-reader.conf get pods` succeeds; listing Pods in `kube-system` is forbidden.

---

## M14 | Advanced | 6 min | 5% | STD

**Scenario:** You are preparing to add another control plane node later.

**Task:** Gather the information and credentials for that join.

**Requirements:**
- Write the cluster's configured control-plane endpoint (taken from the cluster's stored kubeadm configuration, not from memory) to `/opt/exam/m14/endpoint.txt`.
- Produce a complete **control-plane** join command, with a freshly generated certificate key and a valid token, and save it to `/opt/exam/m14/cp-join.txt`.
- Do not join any node.

**Namespace / Node / Resource info:** Node `cp1`.

**Expected final state:** both files exist; the command contains the control-plane option and the certificate key; the corresponding secret for the key exists in the cluster.

---

## M15 | Intermediate | 6 min | 6% | STD

**Scenario:** A new colleague asks how this cluster is wired to its pluggable interfaces.

**Task:** Report facts about the CNI, CRI and CSI configuration.

**Requirements:** write `/opt/exam/m15/report.txt` with exactly these five lines, filled in from the live cluster and node (not from memory):
```
CNI_CONFIG=<path of the CNI configuration file on cp1>
CNI_BINARIES=<directory holding CNI plugin binaries on cp1>
CRI_ENDPOINT=<runtime socket the kubelet on cp1 uses>
RUNTIME=<container runtime name and version as reported by Kubernetes for node cp1>
```
- The fifth line is `CSI_DRIVERS=<comma-separated list of CSI driver names registered in the cluster, or none>`.

**Namespace / Node / Resource info:** Node `cp1`.

**Expected final state:** five lines, each with a correct value.

---

When finished: `REVIEW: M<n> <your answer>` for each task (you get a score out of 100, then convert with the weights above), `SOLUTION: M<n>` for a Burmese walkthrough, `HINT: M<n>` for hints, then `PROGRESS` to update the tracker.
