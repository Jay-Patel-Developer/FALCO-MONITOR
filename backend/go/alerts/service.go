package alerts

import "context"

// AlertService defines the interface for alert streaming and management.
type AlertService interface {
	Start(ctx context.Context) error
	Stop() error
	GetAlerts() []*Alert
}
