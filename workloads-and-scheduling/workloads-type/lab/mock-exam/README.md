Context: You are working in a Kubernetes cluster. The namespace web exists. You have a manifest file at /opt/workloads/web-deploy.yaml that currently contains an incomplete Deployment.

Task:

    Modify the Deployment in /opt/workloads/web-deploy.yaml so that it has 3 replicas and uses the image nginx:1.25.

    Apply the manifest and verify the Pods are running.

    Perform a rolling update to change the image to nginx:1.26.

    Check the rollout status and then rollback to the previous version.

    Create a CronJob named backup in the web namespace. It should run every 5 minutes, use the image busybox, and execute the command sh -c "echo backup complete".
