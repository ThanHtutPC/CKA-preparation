# CKA Preparation (Study Materials)

This **`main`** branch is dedicated to **CKA study materials** (notes, labs, manifests, cheatsheets, mock exam practice, and progress tracking).

> Workflow note: study materials are maintained on `main`; the CKA planner application is maintained separately on the `cka-prepare` branch.

## Goal
Prepare for the **Certified Kubernetes Administrator (CKA)** exam with structured, hands-on practice aligned to the official CNCF/Linux Foundation curriculum.

## Project Structure (`main`)

```text
.
├── README.md
├── .gitignore
├── progress/                                      # Study logs, checklists, weekly reviews
└── study-materials/
    ├── 01-cluster-architecture-installation-configuration/   # 25%
    │   ├── notes/
    │   ├── labs/
    │   └── manifests/
    ├── 02-workloads-scheduling/                              # 15%
    │   ├── notes/
    │   ├── labs/
    │   └── manifests/
    ├── 03-services-networking/                               # 20%
    │   ├── notes/
    │   ├── labs/
    │   └── manifests/
    ├── 04-storage/                                           # 10%
    │   ├── notes/
    │   ├── labs/
    │   └── manifests/
    ├── 05-troubleshooting/                                   # 30%
    │   ├── notes/
    │   ├── labs/
    │   └── manifests/
    ├── cheatsheets/                                          # kubectl/etcdctl/quick refs
    ├── mock-exams/                                           # Timed scenarios, answers, score notes
    └── environment/                                          # kind/minikube/kubeadm setup notes
```

## CKA Domain Focus (Official Weights)
- **Cluster Architecture, Installation & Configuration** — 25%
- **Workloads & Scheduling** — 15%
- **Services & Networking** — 20%
- **Storage** — 10%
- **Troubleshooting** — 30%

## Suggested Working Convention
- **notes/**: short concept summaries, commands, gotchas
- **labs/**: task description, steps, solution, and verification
- **manifests/**: reusable YAML examples for practice
- **cheatsheets/**: imperative commands and exam-speed snippets
- **mock-exams/**: timed practice tasks and post-review notes
- **progress/**: daily/weekly plan, completion checklist, weak areas

## References (Official)
- CKA Certification: https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/
- CNCF Curriculum: https://github.com/cncf/curriculum
- Kubernetes Docs: https://kubernetes.io/docs/home/
- kubectl Quick Reference: https://kubernetes.io/docs/reference/kubectl/quick-reference/

## Notes
- Keep study materials and planner app work separated by branch (`main` vs `cka-prepare`) to avoid accidental changes/deletions.
- Verify the latest exam curriculum/environment details from official sources before exam day.
