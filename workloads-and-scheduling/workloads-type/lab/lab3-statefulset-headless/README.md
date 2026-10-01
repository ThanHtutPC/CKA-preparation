Create:

    A headless Service named db-svc in namespace data.

    A StatefulSet named db with:

        3 replicas

        Image mysql:8.0

        Volume claim template of 1Gi, ReadWriteOnce

        Mounted at /var/lib/mysql

Verify Pods are named db-0, db-1, db-2 and each has its own PVC.
