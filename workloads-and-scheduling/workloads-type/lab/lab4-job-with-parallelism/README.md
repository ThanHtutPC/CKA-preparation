Create a Job named pi-job in namespace batch that:

    Uses image perl:5.34

    Runs the command: perl -Mbignum=bpi -wle 'print bpi(2000)'

    Requires 4 successful completions

    Runs 2 Pods in parallel

    Retries up to 3 times on failure

Verify the Job completes.
