# Falco gRPC Protobufs

This directory contains protobuf definitions for optional Falco gRPC integration.

- For phase 1, gRPC is not required; all analytics and alerts are served from Redis and WebSocket endpoints.
- To add Falco gRPC support, download Falco's protobufs from:
  https://github.com/falcosecurity/client-go/tree/master/protobuf

Place the relevant .proto files here (e.g., `outputs.proto`).

To generate Go code:

```
protoc --go_out=. --go-grpc_out=. outputs.proto
```

Or use the official Falco client-go module for easier integration.

## Phase 1 Completion
- gRPC integration is optional and not required for dashboard/analytics.
