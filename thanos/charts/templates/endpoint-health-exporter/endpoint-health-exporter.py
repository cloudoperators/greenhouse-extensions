import time
import yaml
import grpc
import sys
from grpc_health.v1 import health_pb2, health_pb2_grpc
from prometheus_client import start_http_server, Gauge

ENDPOINTS_FILE = "/sd-config/endpoint-targets.yaml"
CHECK_INTERVAL = 10  # seconds

# 1 = healthy, 0 = not healthy or unreachable
endpoint_health = Gauge(
    "grpc_endpoint_health",
    "gRPC health status of endpoints",
    ["endpoint"]
)

def read_endpoints(filename):
    with open(filename, "r") as f:
        data = yaml.safe_load(f)
        return [ep["address"] for ep in data.get("endpoints", []) if "address" in ep]

def check_health(endpoint, ca_cert):
    try:
        with open(ca_cert, 'rb') as f:
            trusted_certs = f.read()
        creds = grpc.ssl_channel_credentials(root_certificates=trusted_certs)
        channel = grpc.secure_channel(endpoint, creds)
        stub = health_pb2_grpc.HealthStub(channel)
        response = stub.Check(health_pb2.HealthCheckRequest(service=""), timeout=5)
        if response.status == health_pb2.HealthCheckResponse.SERVING:
            return 1
        else:
            return 0
    except Exception:
        return 0

def main():
    endpoints = read_endpoints(ENDPOINTS_FILE)
    ca_cert = "/tls-assets/ca.crt"
    try:
        with open(ca_cert, 'rb') as f:
            pass
    except Exception as e:
        print(f"ERROR: CA certificate '{ca_cert}' is missing or unreadable: {e}", file=sys.stderr)
        sys.exit(1)

    start_http_server(8000)
    print("Prometheus metrics available on :8000/metrics")
    while True:
        for endpoint in endpoints:
            status = check_health(endpoint, ca_cert)
            endpoint_health.labels(endpoint=endpoint).set(status)
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()