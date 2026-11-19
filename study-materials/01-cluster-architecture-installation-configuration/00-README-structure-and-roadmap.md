# CKA Domain 1: Cluster Architecture, Installation & Configuration (25%)

## 1. Repository analysis

The repository at the time of analysis was **empty** (no files found). `MY_REPOSITORY_PATH` in the brief was still a placeholder, so the structure was scaffolded under `study-materials/01-cluster-architecture-installation-configuration/`. No existing files were touched. If your real repo already contains `labs/`, `manifests/`, `notes/`, copy the new folders in; nothing here overwrites anything.

## 2. Recommended final directory structure

```
study-materials/01-cluster-architecture-installation-configuration/
├── 00-README-structure-and-roadmap.md   (this file)
├── 01-learning/        LEARN modules (one .md per topic)
├── 02-exam-practice/   EXAM question sets (no answers)
├── 03-mock-exams/      MOCK EXAM sets (timed)
├── 04-solutions/       SOLUTION write-ups (Burmese explanation)
├── 05-progress/        scores, REVIEW results, weak-topic tracker
├── labs/               existing: runnable lab scripts / step files
├── manifests/          existing: YAML used by labs
└── notes/              existing: your personal notes
```

Conventions: `01-learning/NN-topic-name.md`, `02-exam-practice/exam-topic-name-batch-01.md`, `04-solutions/solutions-topic-name-batch-01.md`. Manifests referenced by labs live in `manifests/<topic>/`.

## 3. Topic coverage checklist

Curriculum validation (web sources, Nov 2026): the CKA is performance-based, about 2 hours, Domain 1 = 25%. The official-curriculum Domain 1 competencies reported by multiple sources are:

1. Manage role-based access control (RBAC)
2. Prepare underlying infrastructure for installing a Kubernetes cluster
3. Create and manage Kubernetes clusters using kubeadm
4. Manage the lifecycle of Kubernetes clusters (upgrades, etcd backup/restore)
5. Implement and configure a highly-available control plane
6. Use Helm and Kustomize to install cluster components
7. Understand extension interfaces (CNI, CSI, CRI)
8. Understand CRDs, install and configure operators

Sources cite the exam environment as Kubernetes **v1.35**, tracking the latest minor version about 4-8 weeks after release. **Confirm on the Linux Foundation CKA page and the CNCF curriculum repo before booking**, since this changes.

Legend: **[EXAM]** = in the official Domain 1 competencies (or directly required to perform them); **[SUPP]** = supplementary, useful for understanding but not a stated objective; **[GAP]** = requested by you but not listed under Domain 1 (often tested in the Troubleshooting domain instead).

| # | Topic | Status | Notes |
|---|-------|--------|-------|
| A1 | Architecture, control plane and node components | [SUPP] | Foundation for every objective |
| A2 | API resources, `kubectl explain` | [SUPP] | Exam speed skill |
| B1 | Infra prep (swap, sysctl, kernel modules, containerd, cgroup driver) | [EXAM] | Objective 2 |
| B2 | `kubeadm init`, join, CNI install | [EXAM] | Objective 3 |
| B3 | kubeadm config files, version management | [EXAM] | Objective 3 and 4 |
| B4 | Cluster upgrade with kubeadm | [EXAM] | Objective 4 |
| C1 | Drain, cordon, uncordon, node maintenance | [EXAM] | Needed for upgrades |
| C2 | Component health checks, cluster troubleshooting | [SUPP] | Heavily tested in the Troubleshooting domain |
| D1 | etcd backup/restore with etcdctl | [EXAM] | Objective 4 |
| D2 | etcd architecture and troubleshooting | [SUPP] | Deepens D1 |
| E1 | Certificates, CA, expiry, `kubeadm certs` renew | [SUPP]/[GAP] | Not a listed Domain 1 bullet; commonly appears in kubeadm and troubleshooting tasks |
| E2 | kubeconfig management, authentication basics | [SUPP] | Needed to switch clusters in the exam |
| E3 | **RBAC** | [EXAM] | **Missing from your brief; add it** |
| F1 | Helm install/repo/upgrade/rollback | [EXAM] | Objective 6 |
| F2 | **Kustomize** | [EXAM] | **Missing from your brief; add it** |
| F3 | CRDs and custom resources, operators | [EXAM] | Objective 7 (partly covered) |
| F4 | **CNI / CSI / CRI extension interfaces** | [EXAM] | **Missing from your brief** |
| F5 | **Highly-available control plane** (stacked vs external etcd, load balancer endpoint, `--control-plane-endpoint`, `--upload-certs`) | [EXAM] | **Missing from your brief** |

## 4. Missing learning materials

Add these to the plan (they are exam objectives your list omits): **RBAC**, **Kustomize**, **CNI/CSI/CRI**, **HA control plane**, plus **operators**. Also worth adding as supplementary: Gateway API (reported as newly added to the Services & Networking domain, not Domain 1), and native sidecars.

## 5. Study roadmap

Pacing is a suggestion; adjust to your schedule. Each step: `LEARN`, do the lab, then `EXAM` on that topic, `REVIEW` your answers.

| Phase | Modules (LEARN topics) | Goal |
|-------|------------------------|------|
| 1 | 01 Kubernetes Architecture; 02 API resources and kubectl explain | Mental model |
| 2 | 03 Infra prep and containerd; 04 kubeadm init/join + CNI | Build a 1 control plane + 2 worker cluster |
| 3 | 05 Node maintenance (drain/cordon); 06 kubeadm upgrade | Lifecycle management |
| 4 | 07 etcd architecture; 08 etcd backup/restore | High-value exam task |
| 5 | 09 Certificates and kubeconfig; 10 RBAC | Security and access |
| 6 | 11 HA control plane | Multi-control-plane |
| 7 | 12 Helm; 13 Kustomize; 14 CRDs/operators; 15 CNI/CSI/CRI | Extensions |
| 8 | MOCK EXAM sets, timed, then weak-topic repair | Exam speed |

Exam-speed habit from day one: use `kubectl` aliases, `--dry-run=client -o yaml`, `kubectl explain`, and the official docs (Kubernetes and Helm docs are the allowed resources).

## 6. Lab environment note

Ubuntu 24.04 VMs via Multipass or VirtualBox: 3 VMs (cp1, w1, w2), 2 vCPU / 2 GB RAM minimum for the control plane. Use `pkgs.k8s.io` versioned apt repos for kubeadm packages, so the upgrade lab can move one minor version.
