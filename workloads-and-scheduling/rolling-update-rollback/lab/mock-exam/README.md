# Mock Exam — Workloads

Time: 30 min. Do each task without looking at the labs.

## Task 1 — Deployment (10 pts)
Create a Deployment `web` with:
- 3 replicas, image nginx:1.25
- RollingUpdate with maxSurge=1, maxUnavailable=0
- Readiness probe on /:80

Then:
a) Roll out to nginx:1.26 without downtime
b) Roll back to revision 1
c) Scale to 5

Deliverable: deployment.yaml

## Task 2 — CronJob (10 pts)
Create a CronJob `backup` that runs every 5 minutes:
- Image busybox:1.36, command: `date; echo backup`
- Keep at most 2 successful and 1 failed Job in history
- Forbid concurrent runs
- Suspend it after verifying a run

Deliverable: crontab.yaml

## Task 3 — Short answers (5 pts)
1. Which ReplicaSet serves traffic after `kubectl rollout undo`?
2. Name the two update strategies for a DaemonSet.
3. Why does a StatefulSet need a headless Service?
4. What is the default `backoffLimit` for a Job?
5. Which field limits how many old ReplicaSets are kept?

## Grading rubric
- Correct apiVersion/kind/fields ......... 60%
- YAML applies cleanly (kubectl apply) ... 20%
- Task executed & verified ............... 20%

## Cleanup
kubectl delete -f deployment.yaml -f crontab.yaml
