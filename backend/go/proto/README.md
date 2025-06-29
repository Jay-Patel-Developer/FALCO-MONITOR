# Falco gRPC Protobufs

Download Falco's protobuf definitions from:
https://github.com/falcosecurity/client-go/tree/master/protobuf

Place the relevant .proto files here (e.g., `outputs.proto`).

To generate Go code:

```
protoc --go_out=. --go-grpc_out=. outputs.proto
```

Or use the official Falco client-go module for easier integration.
