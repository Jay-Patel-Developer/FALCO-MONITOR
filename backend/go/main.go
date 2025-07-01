package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/Jay-Patel-Developer/FALCO-MONITOR/backend/go/alerts"
	pb "github.com/Jay-Patel-Developer/FALCO-MONITOR/backend/go/pb"
)

// runFalcoSubscriber starts the Falco gRPC subscriber if enabled and pushes alerts to Redis and in-memory store.
func runFalcoSubscriber(ctx context.Context, alertChan chan *pb.Response, store *alerts.AlertStore, redisStore *alerts.RedisAlertStore) {
	// Connect to Falco gRPC socket (default path)
	falcoSocket := "unix:///run/falco/falco.sock"
	client, err := alerts.NewFalcoGRPCClient(falcoSocket)
	if err != nil {
		log.Fatalf("Failed to connect to Falco gRPC: %v", err)
	}
	defer client.Close()
	go func() {
		client.SubscribeAlerts(ctx, alertChan, store)
	}()
	go func() {
		for alert := range alertChan {
			// Convert pb.Response to AlertRecord (fill fields as needed)
			alertRecord := alerts.AlertRecord{
				Timestamp: alert.Time,
				Priority:  alert.Priority,
				Rule:      alert.Rule,
				Host:      alert.Hostname,
				// User, Region, Status, DurationMin: fill if available in pb.Response
			}
			if err := redisStore.AddAlert(ctx, &alertRecord); err != nil {
				log.Printf("Failed to add alert to Redis: %v", err)
			}
		}
	}()
}

func main() {
	fmt.Println("Starting Falco Monitor Go backend...")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Set up channel to handle OS interrupts for graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	// Create alert store (buffer up to 1000 alerts)
	store := alerts.NewAlertStore(1000)
	redisStore := alerts.NewRedisAlertStore()
	if err := redisStore.Ping(ctx); err != nil {
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	log.Println("Connected to Redis successfully.")

	// Only run Falco subscriber if enabled (env or flag)
	if os.Getenv("FALCO_SUBSCRIBE") == "1" {
		alertChan := make(chan *pb.Response)
		runFalcoSubscriber(ctx, alertChan, store, redisStore)
	}

	// WebSocket endpoint for live analytics from Redis
	http.HandleFunc("/ws/analytics", func(w http.ResponseWriter, r *http.Request) {
		upgrader := alerts.GetUpgrader()
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}
		defer conn.Close()
		for {
			data, err := redisStore.BuildAnalyticsData(ctx)
			if err != nil {
				log.Printf("Failed to build analytics data: %v", err)
				break
			}
			if err := conn.WriteJSON(data); err != nil {
				log.Printf("WebSocket write error: %v", err)
				break
			}
			select {
			case <-ctx.Done():
				return
			case <-time.After(2 * time.Second):
			}
		}
	})

	// WebSocket endpoint for live alerts from Redis
	http.HandleFunc("/ws/alerts", func(w http.ResponseWriter, r *http.Request) {
		upgrader := alerts.GetUpgrader()
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade error: %v", err)
			return
		}
		defer conn.Close()
		for {
			alerts, err := redisStore.GetAllAlerts(ctx)
			if err != nil {
				log.Printf("Failed to fetch alerts from Redis: %v", err)
				break
			}
			if err := conn.WriteJSON(alerts); err != nil {
				log.Printf("WebSocket write error: %v", err)
				break
			}
			select {
			case <-ctx.Done():
				return
			case <-time.After(2 * time.Second):
			}
		}
	})

	// Start HTTP server
	log.Println("Falco Monitor backend listening on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("HTTP server error: %v", err)
	}
}
