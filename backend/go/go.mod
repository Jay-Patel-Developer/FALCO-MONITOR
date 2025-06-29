module github.com/Jay-Patel-Developer/FALCO-MONITOR/backend/go

go 1.21

require (
	google.golang.org/grpc v1.62.1
	google.golang.org/protobuf v1.33.0
)

require (
	github.com/golang/protobuf v1.5.3 // indirect
	golang.org/x/net v0.20.0 // indirect
	golang.org/x/sys v0.16.0 // indirect
	golang.org/x/text v0.14.0 // indirect
	google.golang.org/genproto/googleapis/rpc v0.0.0-20240123012728-ef4313101c80 // indirect
)

//. Falco gRPC Client Service
// Ensure the gRPC client (already scaffolded) can connect to Falco and receive alerts.
// Add error handling and reconnection logic for robustness.
// Buffer and store received alerts in memory (for querying and streaming).
// 2. Alert Storage & Management
// Implement an in-memory alert store (slice or channel) for MVP.
// (Optional) Add persistent storage (PostgreSQL/MongoDB) for production.
// 3. REST API Service
// Use a framework like net/http or gorilla/mux to expose endpoints:
// GET /alerts — fetch recent alerts (with filtering by time, severity, rule, etc.)
// GET /healthz — health check endpoint
// (Optional) POST /rules — update Falco rules
// 4. WebSocket/Streaming API
// Implement a WebSocket endpoint (/ws/alerts) to push real-time alerts to the frontend.
// Broadcast new alerts to all connected clients.
// 5. Service Organization
// Organize code into packages:
// alerts/ — Falco client, alert structs, alert store
// api/ — HTTP/WebSocket handlers
// main.go — service startup and orchestration
// 6. Configuration & Logging
// Add configuration via environment variables or config file (socket path, port, etc.).
// Use structured logging (e.g., log or zap).
// 7. Testing
// Add unit tests for alert store and API handlers.
// Add integration test for Falco gRPC client (mocked).
// 8. Dockerization
// Write a Dockerfile for the Go backend.
// Add to docker-compose.yml for local development.
