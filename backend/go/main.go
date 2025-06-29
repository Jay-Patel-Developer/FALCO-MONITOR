package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	pb "github.com/Jay-Patel-Developer/FALCO-MONITOR/backend/go/pb"
	"github.com/Jay-Patel-Developer/FALCO-MONITOR/backend/go/alerts"
)

func main() {
	fmt.Println("Starting Falco Monitor Go backend...")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Set up channel to handle OS interrupts for graceful shutdown
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	// Create alert store (buffer up to 1000 alerts)
	store := alerts.NewAlertStore(1000)

	// Connect to Falco gRPC socket (default path)
	falcoSocket := "unix:///run/falco/falco.sock"
	client, err := alerts.NewFalcoGRPCClient(falcoSocket)
	if err != nil {
		log.Fatalf("Failed to connect to Falco gRPC: %v", err)
	}
	defer client.Close()

	alertChan := make(chan *pb.Response)
	go func() {
		client.SubscribeAlerts(ctx, alertChan, store)
	}()

	// REST API: GET /alerts returns all buffered alerts as JSON
	http.HandleFunc("/alerts", func(w http.ResponseWriter, r *http.Request) {
		alerts := store.GetAlerts()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(alerts)
	})

	http.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	server := &http.Server{Addr: ":8080"}
	go func() {
		log.Println("REST API listening on :8080 ...")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("API server error: %v", err)
		}
	}()

	fmt.Println("Listening for Falco alerts...")
	<-stop
	fmt.Println("Shutting down...")
	server.Shutdown(ctx)
}
