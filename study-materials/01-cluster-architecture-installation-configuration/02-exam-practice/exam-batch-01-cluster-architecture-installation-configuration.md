# EXAM: Cluster Architecture, Installation & Configuration, Batch 01

- Questions: 20 (4 Beginner, 8 Intermediate, 8 Advanced), hands-on practical
- Total estimated time: 120 minutes
- Question language: English. Explanations (SOLUTION mode): Burmese
- Answers: **hidden.** Type `SOLUTION: <n>` for a solution, `HINT: <n>` for progressive hints, `REVIEW: <your answer>` to be scored.
- Allowed during practice (as in the real exam): kubernetes.io docs, Helm docs, `kubectl explain`, `--help`.

## Before you start

Lab: the 3-node cluster from `labs/lab-01-ubuntu-kubeadm-cluster.md` (`cp1`, `w1`, `w2`), built at the **older** minor version, VM snapshots taken.
Seed the cluster (run once on cp1): `bash labs/exam-setup.sh b01`.

Lab profiles used below:

| Profile | Meaning |
|---------|---------|
| **STD** | Standard 3-node cluster, run from cp1 as a sudo user |
| **+W3** | STD plus a fresh Ubuntu 24.04 VM named `w3` with nothing installed |
| **+CP2** | STD (initialised with `controlPlaneEndpoint: k8s-api:6443` as in the lab) plus a fresh VM `cp2`, already prepared like cp1 (Lab Tasks 1-3) |
| **UPG** | Cluster still on the older minor version (take a snapshot first; Q14 changes the version of every node) |

Recommended order: 1-12 in any order, then 13, 15, 16, 17, 18, 19, 20 on a snapshot, **14 last**. Q15 needs the snapshot from Q6.

Write every result file to the path given; checkers (you, or `REVIEW:`) look at the cluster state and those files.

---

## Question 1 | Beginner | 4 min | STD

**Scenario:** A CI pipeline running as the ServiceAccount `ci-bot` must be able to inspect Pods in the `dev` namespace, nothing more.

**Task:** Give `ci-bot` read-only access to Pods in `dev`.

**Requirements:**
- A namespaced Role named `pod-reader` allowing only reading (get, list, watch) of Pods.
- A binding named `ci-bot-pod-reader` that grants it to `ci-bot` only.
- No cluster-wide permissions are to be created.

**Namespace / Node / Resource info:** Namespace `dev`; ServiceAccount `ci-bot` already exists.

**Expected final state:** `ci-bot` can list Pods in `dev`, cannot delete Pods in `dev`, and cannot list Pods in `shop`.

---

## Question 2 | Beginner | 3 min | STD (internet access needed)

**Scenario:** The platform team publishes sample charts in a public Helm repository at `https://helm.github.io/examples`.

**Task:** Register the repository locally under the name `examples` and install its `hello-world` chart.

**Requirements:**
- Release name `hello`, namespace `dev`.
- Do not create or modify any chart yourself.

**Namespace / Node / Resource info:** Namespace `dev`; Helm v3 is installed on cp1 (install it first if it is not).

**Expected final state:** `helm list -n dev` shows release `hello` as deployed, and its Pods are Running.

---

## Question 3 | Beginner | 3 min | STD

**Scenario:** Node `w1` needs a kernel update. The `web` Deployment in `shop` has 4 replicas.

**Task:** Take `w1` out of service for maintenance, then return it to service.

**Requirements:**
- While in maintenance: no workload Pods from `shop` may run on `w1`, and no new Pods may be scheduled there.
- Pods managed by DaemonSets must not cause the operation to fail.
- After maintenance, `w1` must accept new Pods again.
- Save the output of `kubectl get pods -n shop -o wide` taken **during** maintenance to `/opt/exam/q3/during.txt`.

**Namespace / Node / Resource info:** Node `w1`, namespace `shop`, Deployment `web`.

**Expected final state:** `w1` is Ready and schedulable; all 4 `web` replicas are Running; `/opt/exam/q3/during.txt` shows none of them on `w1`.

---

## Question 4 | Beginner | 3 min | STD

**Scenario:** You were given a standalone kubeconfig file at `/opt/exam/q4/kubeconfig` that already contains a cluster entry and a user entry for the lab cluster.

**Task:** Add a new context to **that file only** and make it the default.

**Requirements:**
- Context name `dev-admin`, using the existing cluster and user entries in that file, with default namespace `dev`.
- `dev-admin` must be the current context of that file.
- Write the names of all contexts in that file, one per line, to `/opt/exam/q4/contexts.txt`.
- Do not change `~/.kube/config`.

**Namespace / Node / Resource info:** File `/opt/exam/q4/kubeconfig`, namespace `dev`.

**Expected final state:** `kubectl --kubeconfig /opt/exam/q4/kubeconfig get pods` queries namespace `dev` without extra flags; `contexts.txt` lists the contexts.

---

## Question 5 | Intermediate | 5 min | STD

**Scenario:** The security team wants a lightweight agent that must keep running on `w1` even if the API server is unavailable.

**Task:** Run an agent on `w1` that the kubelet manages directly, not through the API server.

**Requirements:**
- Pod name `audit-agent`, namespace `shop`, image `busybox:1.36`, command that keeps it running (sleep 3600).
- Label `tier=agent`; CPU request `50m`.
- It must only run on `w1`.
- It must not be removable with `kubectl delete pod`.

**Namespace / Node / Resource info:** Node `w1`, namespace `shop`.

**Expected final state:** `kubectl get pod -n shop` shows `audit-agent-w1` Running on `w1`; deleting it through the API makes it come back.

---

## Question 6 | Intermediate | 4 min | STD

**Scenario:** Before a risky change you must back up the cluster's data store.

**Task:** Take a snapshot of etcd and verify it.

**Requirements:**
- Snapshot file: `/opt/backup/etcd-snapshot.db` (on cp1).
- Authenticate to etcd with the certificates your cluster actually uses; find them yourself.
- Save the snapshot status (hash, revision, total keys, size) as a table to `/opt/exam/q6/snapshot-status.txt`.

**Namespace / Node / Resource info:** Node `cp1`, stacked etcd static Pod.

**Expected final state:** The snapshot file exists and is a valid etcd snapshot; the status file contains the table. **Keep this snapshot unchanged: Q15 uses it.**

---

## Question 7 | Intermediate | 5 min | STD

**Scenario:** An audit asks about certificate lifetimes, and the API server certificate must be refreshed now.

**Task:** Report expiry dates and renew one certificate.

**Requirements:**
- Save the expiry information of all certificates managed by kubeadm to `/opt/exam/q7/expiry.txt`.
- Save the serial number of the current API server serving certificate to `/opt/exam/q7/serial-before.txt`.
- Renew **only** the API server certificate.
- After the change, the API server must be serving the renewed certificate; save its serial to `/opt/exam/q7/serial-after.txt`.
- The cluster must remain usable.

**Namespace / Node / Resource info:** Node `cp1`, `/etc/kubernetes/pki`.

**Expected final state:** the two serial files differ; `kubectl get nodes` works; other certificates unchanged.

---

## Question 8 | Intermediate | 6 min | STD

**Scenario:** Base manifests for `webapp` exist in `/opt/exam/q8/base`. You need a production variant without editing the base files.

**Task:** Create a Kustomize overlay and deploy it.

**Requirements:**
- Overlay directory: `/opt/exam/q8/overlays/prod`.
- Namespace `shop-prod` (create it) for all resources.
- All resource names prefixed with `prod-`.
- 3 replicas; image tag `1.27` instead of the base's tag.
- Every resource labelled `env=prod`.
- The container gets an environment variable `APP_MODE=production`.
- Deploy using Kustomize built into kubectl.

**Namespace / Node / Resource info:** Namespace `shop-prod`; base is read-only.

**Expected final state:** `prod-webapp` Deployment 3/3 available with the new image and the env var; Service `prod-webapp` has 3 endpoints; the base directory files are unchanged.

---

## Question 9 | Intermediate | 7 min | STD

**Scenario:** Your team wants to manage backup schedules as Kubernetes objects.

**Task:** Extend the API with a custom resource type and create one object.

**Requirements:**
- API group `stable.lab.io`, version `v1`, kind `Backup`, plural `backups`, singular `backup`, short name `bk`, namespaced.
- Schema: `spec.schedule` (string, required) and `spec.retentionDays` (integer, minimum 1, default 7).
- `kubectl get bk` must show columns `NAME`, `SCHEDULE`, `RETENTION`.
- Create a `Backup` named `nightly` in `shop` with schedule `0 2 * * *` and **without** setting `retentionDays`.

**Namespace / Node / Resource info:** Namespace `shop`; cluster-scoped CRD.

**Expected final state:** `kubectl get bk -n shop` shows `nightly` with retention `7`; creating a `Backup` with `retentionDays: 0` is rejected.

---

## Question 10 | Intermediate | 4 min | STD

**Scenario:** Members of the group `ops-team` need to look at nodes across the cluster but must not change anything.

**Task:** Grant cluster-wide read-only access to nodes.

**Requirements:**
- ClusterRole `node-viewer` with get, list, watch on nodes only.
- ClusterRoleBinding `node-viewers` for the group `ops-team`.
- Save the result of three authorization checks, run as user `jane` in group `ops-team`, to `/opt/exam/q10/checks.txt`: list nodes, delete nodes, list pods in `kube-system`.

**Namespace / Node / Resource info:** Cluster-scoped. No real user `jane` exists; use impersonation.

**Expected final state:** the checks file shows allowed, denied, denied (in that order, one per line, with the check described).

---

## Question 11 | Intermediate | 3 min | STD

**Scenario:** A new worker will be added later by a colleague who needs a join command that works for the next two hours only.

**Task:** Prepare join information.

**Requirements:**
- Create a new bootstrap token valid for 2 hours.
- Save the complete worker join command to `/opt/exam/q11/join.txt`.
- Compute the CA certificate hash independently (not by copying it from the join command) and save only the `sha256:<hash>` string to `/opt/exam/q11/ca-hash.txt`.
- Both hashes must be identical.

**Namespace / Node / Resource info:** Node `cp1`.

**Expected final state:** `join.txt` has a valid command with a token that expires in about 2 hours; `ca-hash.txt` matches the hash inside `join.txt`.

---

## Question 12 | Intermediate | 5 min | STD

**Scenario:** You maintain a small in-house chart and need to ship a change, then undo it.

**Task:** Manage the release lifecycle with Helm.

**Requirements:**
- Create a new chart named `webchart` under `/opt/exam/q12` using Helm's scaffolding.
- Install it as release `web-rel` in namespace `shop` with default values.
- Upgrade the release so the Deployment runs 3 replicas and image tag `1.27`.
- Roll the release back to revision 1.
- Save `helm history` of the release to `/opt/exam/q12/history.txt`.

**Namespace / Node / Resource info:** Namespace `shop`.

**Expected final state:** release `web-rel` is deployed with revision 3 (a rollback creates a new revision) and runs the original replica count and image; the history file shows the three revisions.

---

## Question 13 | Advanced | 10 min | +W3

**Scenario:** The cluster needs more capacity. A fresh Ubuntu 24.04 VM `w3` has been provisioned with nothing installed.

**Task:** Add `w3` as a worker node.

**Requirements:**
- Prepare `w3` for Kubernetes with a containerd runtime that is consistent with the cluster's cgroup configuration.
- Install Kubernetes node packages at the **same minor and patch version** as the existing nodes; the packages must be protected from accidental upgrades.
- Join `w3` to the cluster securely.
- Label the node `disk=ssd`.

**Namespace / Node / Resource info:** Node `w3`, control plane `cp1`.

**Expected final state:** `kubectl get nodes` shows `w3` Ready with the same VERSION as the others and the label; a Deployment with 6 replicas schedules Pods onto `w3`.

---

## Question 14 | Advanced | 12 min | UPG (do last)

**Scenario:** The cluster runs the older minor version; the next minor is available. Maintenance window is open.

**Task:** Upgrade the whole cluster one minor version.

**Requirements:**
- Upgrade control plane `cp1` first, then each worker, one at a time.
- Workloads on a node must be moved away before that node's kubelet is upgraded and the node must be returned to service afterwards.
- Use the same patch release on every node; hold the packages again afterwards.
- Save the upgrade plan output taken before you start to `/opt/exam/q14/plan.txt`.

**Namespace / Node / Resource info:** Nodes `cp1`, `w1`, `w2` (and `w3` if you built it).

**Expected final state:** all nodes Ready at the new version; kube-system Pods Running; `kubeadm version`, `kubelet --version` and `kubectl version` agree; `/opt/exam/q14/plan.txt` exists.

---

## Question 15 | Advanced | 10 min | STD (after Q6)

**Scenario:** After Q6's snapshot was taken, someone deployed a faulty application into a new namespace `payments`, and the cluster is now considered corrupted. Management decides to roll the cluster back to the Q6 snapshot.

**Task:** First run `bash labs/exam-setup.sh q15` (this creates the faulty `payments` namespace). Then restore the cluster state from `/opt/backup/etcd-snapshot.db`.

**Requirements:**
- Restore into a **new** data directory `/var/lib/etcd-restored`; do not delete the original directory.
- etcd must use the restored data.
- Be careful with how the API server behaves while etcd is down.

**Namespace / Node / Resource info:** Node `cp1`; etcd is a static Pod.

**Expected final state:** `kubectl get ns` no longer shows `payments`, still shows `shop`/`dev`; all control plane Pods Running; the etcd manifest points at `/var/lib/etcd-restored`.

---

## Question 16 | Advanced | 5 min | STD

**Scenario:** Since a change this morning, new Pods stay `Pending` forever. Existing Pods are fine.

**Task:** Run `sudo bash labs/exam-fault-inject.sh q16` on `cp1` **without reading the script**, then find and fix the problem.

**Requirements:**
- Find the root cause using logs and the control plane's own configuration, not by recreating components.
- Write the root cause in one sentence to `/opt/exam/q16/cause.txt`.
- Verify by creating a Deployment `probe` (nginx, 2 replicas) in `shop`.

**Namespace / Node / Resource info:** Node `cp1`, namespace `shop`.

**Expected final state:** `probe` Pods are Running and assigned to nodes; `cause.txt` states the cause.

---

## Question 17 | Advanced | 6 min | STD

**Scenario:** Node `w1` suddenly became `NotReady`.

**Task:** On `w1`, run `sudo bash exam-fault-inject.sh q17` **without reading the script** (copy the file to `w1` first), wait until `kubectl get nodes` on cp1 shows `NotReady`, then diagnose and repair.

**Requirements:**
- Do not reboot the node, do not reset or re-join it.
- Save the first error message that points to the cause (from the right log) to `/opt/exam/q17/evidence.txt`.
- Fix the cause.

**Namespace / Node / Resource info:** Node `w1`.

**Expected final state:** `w1` is `Ready`; Pods on `w1` Running; evidence file contains the relevant log line.

---

## Question 18 | Advanced | 10 min | +CP2

**Scenario:** The cluster was created with a stable control-plane endpoint name. The business wants a second control plane node for resilience.

**Task:** Add `cp2` as an additional control plane node.

**Requirements:**
- Use the same endpoint the cluster was initialised with.
- Control plane certificates must be shared with the new node securely, using the kubeadm mechanism (no manual copying of private keys).
- The new node must also run an etcd member.
- Save the output of the etcd member list to `/opt/exam/q18/members.txt`.

**Namespace / Node / Resource info:** Nodes `cp1`, `cp2`; endpoint name defined in `/etc/hosts` on both.

**Expected final state:** `kubectl get nodes` shows `cp2` as control-plane and Ready; `members.txt` lists two etcd members; kube-system has apiserver, scheduler, controller-manager and etcd Pods on both.

---

## Question 19 | Advanced | 8 min | STD

**Scenario:** A new developer, `alice`, needs to use the cluster with her own certificate-based identity.

**Task:** Create her credentials through the Kubernetes certificate API and give her limited access.

**Requirements:**
- Generate a private key and certificate request for user `alice` (group `devs`) under `/opt/exam/q19`.
- Submit the request through the Kubernetes certificates API with a signer suitable for client authentication and a 24-hour validity; approve it and retrieve the issued certificate.
- Build `/opt/exam/q19/alice.kubeconfig` with context `alice@lab`, using embedded data.
- Allow `alice` to get, list and watch Pods **in `dev` only** (Role `dev-pod-viewer`, binding `alice-pod-viewer`).

**Namespace / Node / Resource info:** Namespace `dev`.

**Expected final state:** with her kubeconfig, `get pods -n dev` works (an empty list is fine), while `get pods -n kube-system` and `get nodes` are forbidden.

---

## Question 20 | Advanced | 7 min | STD (internet access needed)

**Scenario:** Your platform needs automatic certificate management for workloads. You decide to install the cert-manager operator.

**Task:** Install the operator from its official Helm repository `https://charts.jetstack.io` and prove it works.

**Requirements:**
- Release name `cert-manager` in a new namespace `cert-manager`; the operator's CRDs must be installed as part of the release.
- Create a self-signed cluster-wide issuer named `selfsigned-issuer`.
- Request a certificate named `web-cert` in namespace `shop` for DNS name `web.shop.svc`, stored in the Secret `web-tls`, signed by that issuer.
- Save the output of the check that shows the certificate is Ready to `/opt/exam/q20/ready.txt`.

**Namespace / Node / Resource info:** Namespaces `cert-manager`, `shop`.

**Expected final state:** the cert-manager Pods are Running; `web-cert` is Ready; Secret `web-tls` exists in `shop`.

---

### Time budget summary

| Level | Questions | Time |
|-------|-----------|------|
| Beginner | 1-4 | 13 min |
| Intermediate | 5-12 | 39 min |
| Advanced | 13-20 | 68 min |
| **Total** | 20 | **120 min** |

When done: `REVIEW: Q<n> <your commands / YAML / outputs>` for scoring, `SOLUTION: <n>` for the Burmese walkthrough, `HINT: <n>` for hints, `NEXT:` for another batch.
