package alerts

import (
	"context"
	"log"
	"time"

	pb "github.com/Jay-Patel-Developer/FALCO-MONITOR/backend/go/pb"
	"google.golang.org/grpc"
)

// FalcoGRPCClient handles connection to Falco's gRPC output.
type FalcoGRPCClient struct {
	conn   *grpc.ClientConn
	client pb.OutputServiceClient
}

// NewFalcoGRPCClient creates a new client connected to the Falco gRPC socket.
func NewFalcoGRPCClient(socketPath string) (*FalcoGRPCClient, error) {
	conn, err := grpc.Dial(socketPath, grpc.WithInsecure())
	if err != nil {
		return nil, err
	}
	client := pb.NewOutputServiceClient(conn)
	return &FalcoGRPCClient{conn: conn, client: client}, nil
}

// SubscribeAlerts subscribes to Falco alert events and sends them to the provided channel.
func (c *FalcoGRPCClient) SubscribeAlerts(ctx context.Context, alerts chan<- *pb.Response, store *AlertStore) {
	for {
		stream, err := c.client.Sub(ctx, &pb.Request{})
		if err != nil {
			log.Printf("Failed to subscribe to Falco alerts: %v. Retrying in 5s...", err)
			select {
			case <-ctx.Done():
				return
			case <-time.After(5 * time.Second):
			}
			continue
		}
		for {
			resp, err := stream.Recv()
			if err != nil {
				log.Printf("Falco gRPC stream closed: %v. Reconnecting in 5s...", err)
				break
			}
			store.AddAlert(resp)
			alerts <- resp
		}
		select {
		case <-ctx.Done():
			return
		case <-time.After(5 * time.Second):
		}
	}
}

// Close closes the gRPC connection.
func (c *FalcoGRPCClient) Close() error {
	return c.conn.Close()
}
