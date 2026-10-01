Create a CronJob named db-backup in namespace ops that:

    Runs every 30 minutes

    Uses image postgres:15

    Executes: pg_dump -U admin mydb > /backup/db.sql

    Forbids overlapping runs

    Keeps 2 successful and 1 failed Job in history

Verify the schedule is correct with kubectl get cronjob.
