package alerts

import (
	"sync"

	pb "github.com/Jay-Patel-Developer/FALCO-MONITOR/backend/go/pb"
)

// AlertStore is an in-memory buffer for Falco alerts.
type AlertStore struct {
	mu     sync.RWMutex
	alerts []*pb.Response
	max    int
}

// NewAlertStore creates a new AlertStore with a max buffer size.
func NewAlertStore(max int) *AlertStore {
	return &AlertStore{alerts: make([]*pb.Response, 0, max), max: max}
}

// AddAlert adds a new alert to the store, evicting oldest if full.
func (s *AlertStore) AddAlert(alert *pb.Response) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if len(s.alerts) >= s.max {
		s.alerts = s.alerts[1:]
	}
	s.alerts = append(s.alerts, alert)
}

// GetAlerts returns a copy of all stored alerts.
func (s *AlertStore) GetAlerts() []*pb.Response {
	s.mu.RLock()
	defer s.mu.RUnlock()
	copyAlerts := make([]*pb.Response, len(s.alerts))
	copy(copyAlerts, s.alerts)
	return copyAlerts
}
