#curl --cacert /tmp/pem/ca.crt --cert /tmp/pem/client.crt --key /tmp/pem/client.key https://localhost:6443
kubectl config view --raw -o jsonpath='{.users[0].user.client-certificate-data}' | base64 -d > /tmp/client.crt
kubectl config view --raw -o jsonpath='{.users[0].user.client-key-data}' | base64 -d > /tmp/client.key
kubectl config view --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}' | base64 -d > /tmp/ca.crt

curl --cacert /tmp/ca.crt --cert /tmp/client.crt --key /tmp/client.key https://localhost:6443/api/v1/namespaces
echo "Done"
