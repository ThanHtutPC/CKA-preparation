# CKA Complete Preparation & Study Planner

This repository contains:
- **Existing CKA preparation materials** (notes, labs, manifests, and practice files added over time), and
- **A working interactive CKA Study Planner web application** (React + TypeScript) for structured learning, hands-on tracking, and exam readiness monitoring.

> UI/learning content in the app includes **Burmese explanations** while preserving **English Kubernetes terminology** (e.g., Pod, Deployment, RBAC, kubeadm, etcd, CoreDNS).

## 1. What’s Included

### Web Application (interactive)
- Dashboard with progress, study hours, lab completion, exam countdown, mock scores, weekly progress chart, and estimated readiness
- CKA Curriculum browser (official domains/competencies, topic details, search/filter, progress tracking)
- Learning Roadmap (beginner → exam-ready, exam-required vs supplementary guidance)
- Courses & Resources (verified sources only; searchable/filterable)
- Hands-on Labs (objectives, prerequisites, setup, steps, YAML/commands, expected output, troubleshooting, verification checklist)
- Daily Study Planner (30/60/90-day plans, customizable daily study hours, dynamic completion date)
- Mock Exams (score tracking and notes)
- Notes (per-topic personal notes)
- Progress Reports (weak areas, completion metrics, next actions)
- Settings (theme, exam date, plan settings, JSON/CSV import/export, reset)

### Repository Structure (organized)
```text
.
├── src/                    # Web app source (React + TypeScript)
├── public/                 # Static public assets
├── data/                   # Prepared CSV datasets for the app
├── scripts/                # Utility scripts (e.g. CSV regeneration)
├── study-materials/        # Existing CKA notes/labs/manifests/practice files
├── Dockerfile              # Container build (Node build + Nginx runtime)
├── docker-compose.yml      # Easy container run
├── nginx.conf              # SPA routing config for Nginx
├── index.html
├── package.json
├── package-lock.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

### Existing Repository Study Materials (examples)
To keep the project root tidy, existing practice folders/manifests/scripts are organized under:
- `study-materials/`

Examples inside `study-materials/`:
- `cluster-architecture/` (kubeadm, RBAC, etcd backup/restore, HA control plane, Helm/Kustomize labs/docs)
- `workloads-and-scheduling/`, `workload-mangement/`
- `service-loadBalancer-networking/` (services, ingress, gateway API, network policy, CNI/Cilium materials)
- `storage/`
- `configuration/`, `kind/`, `kustomize/`, `metallb/`, `app/`, `api-test.sh`, and more

These materials can be used alongside the app’s lab/checklist tracking.

## 2. Official CKA Curriculum Basis (verified)

The app’s curriculum data is aligned to the current official CKA domains/competencies and exam resources:

- **Linux Foundation CKA page:** https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/
- **CNCF Curriculum repository:** https://github.com/cncf/curriculum

**Official domain weights used in the app:**
- Cluster Architecture, Installation & Configuration — **25%**
- Workloads & Scheduling — **15%**
- Services & Networking — **20%**
- Storage — **10%**
- Troubleshooting — **30%**

> Exam environment/version details change over time. The app includes competency-aligned topics and notes; always verify the latest exam version/curriculum details on the official pages above before your exam.

## 3. Technology Stack

- **Frontend:** React + TypeScript (Vite)
- **Styling/UI:** Tailwind CSS (dark/light mode, responsive layout)
- **Charts:** Recharts
- **Routing:** React Router
- **Initial data source:** Structured JSON (`src/data/*.json`)
- **Persistent user progress/settings:** LocalStorage (modular state layer for future migration)
- **Data portability:** JSON and CSV import/export

**Future-ready design targets (not implemented as backend in this repo):**
- Backend: Python FastAPI
- Database: PostgreSQL (current data model is structured to migrate)

## 4. Application Architecture & Data Model

### Key source folders
- `src/pages/` — UI pages (Dashboard, Curriculum, Roadmap, Resources, Labs, Planner, Mock Exams, Notes, Reports, Settings)
- `src/components/` — reusable UI components (expandable)
- `src/state/` — app state/context, progress/settings actions
- `src/utils/` — storage, CSV, planner/date helpers
- `src/data/` — seed datasets (JSON)
- `src/types.ts` — TypeScript domain/data models

### Seed datasets (JSON)
- `src/data/domains.json` — CKA domains, weights, competencies
- `src/data/topics.json` — topic details (theory, Burmese explanations, commands, YAML, exercises, outcomes, hours, difficulty, exam-required flag)
- `src/data/labs.json` — hands-on lab definitions
- `src/data/courses.json` — course/core resource recommendations (verified URLs)
- `src/data/learningResources.json` — learning resources (verified URLs)
- `src/data/studyPlans.json` — 30/60/90-day plan templates (blocks, mock/assessment schedules)

### Prepared CSV datasets (repo)
- `data/cka_domains.csv`
- `data/cka_topics.csv`
- `data/cka_courses.csv`
- `data/cka_labs.csv`
- `data/study_plan.csv`
- `data/learning_resources.csv`

> The app also supports exporting current datasets/progress as JSON/CSV from **Settings**.

## 5. Setup & Installation

### Prerequisites
- **Node.js** (recommended: current LTS or newer)
- **npm** (comes with Node.js)

Check versions:
```bash
node -v
npm -v
```

### Install dependencies
```bash
npm install
```

### Run in development
```bash
npm run dev
```
Then open the local URL shown by Vite (usually `http://localhost:5173`).

### Build for production
```bash
npm run build
```

### Preview production build
```bash
npm run preview
```

## 6. Run with Docker (optional)

### Build and run (Docker)
```bash
docker build -t cka-study-planner:latest .
docker run -d --name cka-study-planner -p 8080:80 --restart unless-stopped cka-study-planner:latest
```
Open: `http://localhost:8080`

### Run with Docker Compose
```bash
docker compose up -d --build
```
Open: `http://localhost:8080`

Stop:
```bash
docker compose down
```

### Persistence note (important)
- This web app stores user progress/settings/notes in **browser LocalStorage** (client-side), not in the container filesystem.
- Container restart/recreate does **not** remove browser LocalStorage, but clearing browser data or switching browser/device will lose local progress.
- For persistent backups, use **Settings → Export JSON** (and import when needed). Server-side persistence would require adding a backend/database.

## 7. Usage Guide

1. **Settings**: set theme, exam date, daily study hours, active plan (30/60/90), and plan start date.
2. **Dashboard**: monitor overall progress, domain completion, labs completed, mock scores, and readiness.
3. **CKA Curriculum**: browse/search topics by domain, read Burmese explanations + commands/YAML, mark status, log hours/deadlines, and track lab completion.
4. **Hands-on Labs**: follow step-by-step labs and mark topic lab checkpoints complete.
5. **Daily Study Planner**: view generated day-by-day schedule and dynamic completion date based on your daily study time.
6. **Mock Exams**: record scores and notes to identify weak areas.
7. **Notes / Progress Reports**: maintain study notes and review weak domains.
8. **Settings → Data Management**: export/import JSON or export CSV datasets for backup and portability.

## 8. Curriculum Coverage & Content Notes

- Topics are organized by the **5 official CKA domains** with current official weights.
- The app includes **exam-required** topics/competencies and clearly labels **supplementary** items where applicable.
- Explanations are provided in **Burmese** with **English Kubernetes terminology** preserved.
- Learning resources/courses in the app prioritize **verified official sources** (e.g., Kubernetes docs, Linux Foundation CKA page, CNCF curriculum repo, Gateway API docs, Killer.sh, Kubernetes The Hard Way). No invented course URLs are added.

## 9. Data Persistence & Migration Notes

- **Current persistence:** Browser `LocalStorage` (`cka-study-planner-v1`)
- **Import/Export:** JSON state export/import and CSV dataset export supported
- **Migration path:** state/data utilities and typed models are separated to simplify future migration to IndexedDB or a backend (FastAPI + PostgreSQL)

## 10. Regenerating CSV Datasets

If seed JSON files in `src/data/` are updated, regenerate CSV datasets with:
```bash
node scripts/generate-csv.mjs
```

## 11. Disclaimer

This project is a study aid for CKA preparation. Always confirm the latest official exam objectives, policies, and environment details on the Linux Foundation/CNCF pages before taking the exam. Practice hands-on tasks in your own Kubernetes environments and follow your organization’s security best practices when handling credentials/configuration.
