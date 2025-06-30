# Falco Monitor Go Backend

This directory contains the Go API server for Falco Monitor, providing live analytics and alert streaming to the frontend.

## Features (Phase 1)

- **WebSocket Endpoints**: Serves analytics (`/ws/analytics`) and alerts (`/ws/alerts`) as live streams for the frontend.
- **Redis-backed Storage**: All alerts are stored and aggregated in Redis for fast analytics.
- **Loader Script**: `load_sample_alerts.go` loads sample alerts from JSON into Redis for demo/testing.
- **Falco gRPC Subscription (Optional)**: Can subscribe to a running Falco instance for real alerts (set `FALCO_SUBSCRIBE=1`).
- **No REST Endpoints**: All data is served via WebSocket only.

## Getting Started

1. **Install dependencies**

   ```bash
   cd backend/go
   go mod tidy
   ```

2. **Load sample alerts into Redis**

   ```bash
   go run load_sample_alerts.go
   ```

3. **Run the backend server**

   ```bash
   go run main.go
   ```

## Next Steps
- Add more analytics, alert actions, and error handling as needed.
- Integrate with Falco gRPC for live production alerts (optional).

## Phase 1 Completion
- Backend is fully functional for dashboard and analytics streaming.
