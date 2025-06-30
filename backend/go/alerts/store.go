package alerts

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	pb "github.com/Jay-Patel-Developer/FALCO-MONITOR/backend/go/pb"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

// AlertStore is an in-memory buffer for Falco alerts (for fast access and streaming).
type AlertStore struct {
	mu     sync.RWMutex
	alerts []*pb.Response
	max    int
}

// NewAlertStore creates a new AlertStore with a max buffer size.
func NewAlertStore(max int) *AlertStore {
	return &AlertStore{alerts: make([]*pb.Response, 0, max), max: max}
}

// AddAlert adds a new alert to the store, evicting the oldest if full.
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

// RedisAlertStore is a Redis-backed store for Falco alerts and analytics.
type RedisAlertStore struct {
	client *redis.Client
}

// NewRedisAlertStore creates a new RedisAlertStore with default local Redis config.
func NewRedisAlertStore() *RedisAlertStore {
	client := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379",
		Password: "", // no password set
		DB:       0,  // use default DB
	})
	return &RedisAlertStore{client: client}
}

// AddAlert stores an alert in Redis (as a hash).
func (s *RedisAlertStore) AddAlert(ctx context.Context, alert *AlertRecord) error {
	key := RedisAlertPrefix + alert.Timestamp
	return s.client.HSet(ctx, key, map[string]interface{}{
		"id":               alert.ID,
		"timestamp":        alert.Timestamp,
		"priority":         alert.Priority,
		"rule":             alert.Rule,
		"host":             alert.Host,
		"user":             alert.User,
		"region":           alert.Region,
		"status":           alert.Status,
		"duration_minutes": alert.DurationMin,
	}).Err()
}

// GetAllAlerts fetches all alerts from Redis (for demo: scan all keys with prefix).
func (s *RedisAlertStore) GetAllAlerts(ctx context.Context) ([]*AlertRecord, error) {
	var alerts []*AlertRecord
	iter := s.client.Scan(ctx, 0, RedisAlertPrefix+"*", 0).Iterator()
	for iter.Next(ctx) {
		key := iter.Val()
		fields, err := s.client.HGetAll(ctx, key).Result()
		if err != nil || len(fields) == 0 {
			continue
		}
		alert := &AlertRecord{
			ID:          parseInt(fields["id"]),
			Timestamp:   fields["timestamp"],
			Priority:    fields["priority"],
			Rule:        fields["rule"],
			Host:        fields["host"],
			User:        fields["user"],
			Region:      fields["region"],
			Status:      fields["status"],
			DurationMin: parseInt(fields["duration_minutes"]),
		}
		alerts = append(alerts, alert)
	}
	return alerts, iter.Err()
}

// Ping checks the connection to Redis.
func (s *RedisAlertStore) Ping(ctx context.Context) error {
	return s.client.Ping(ctx).Err()
}

// parseInt is a helper to safely parse int from string
func parseInt(s string) int {
	var i int
	_, _ = fmt.Sscanf(s, "%d", &i)
	return i
}

// GetUpgrader returns a websocket.Upgrader with permissive CORS for demo/testing.
func GetUpgrader() *websocket.Upgrader {
	return &websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin:     func(r *http.Request) bool { return true },
	}
}

// AnalyticsData matches the structure of sample_charts_data.json for analytics dashboard.
// Add/adjust fields as needed for your analytics
type AnalyticsData struct {
	AlertsOverTime []struct {
		Timestamp string `json:"timestamp"`
		Count     int    `json:"count"`
	} `json:"alerts_over_time"`
	AlertsByPriority []struct {
		Priority string `json:"priority"`
		Count    int    `json:"count"`
	} `json:"alerts_by_priority"`
	TopRules []struct {
		Rule  string `json:"rule"`
		Count int    `json:"count"`
	} `json:"top_rules"`
	AlertsByRuleOverTime []struct {
		Timestamp string `json:"timestamp"`
		Rule      string `json:"rule"`
		Count     int    `json:"count"`
	} `json:"alerts_by_rule_over_time"`
	AlertsByHost []struct {
		Host  string `json:"host"`
		Count int    `json:"count"`
	} `json:"alerts_by_host"`
	AlertsHeatmap []struct {
		Day   string `json:"day"`
		Hour  int    `json:"hour"`
		Count int    `json:"count"`
	} `json:"alerts_heatmap"`
	AlertStatus []struct {
		Status string `json:"status"`
		Count  int    `json:"count"`
	} `json:"alert_status"`
	TopUsers []struct {
		User  string `json:"user"`
		Count int    `json:"count"`
	} `json:"top_users"`
	AlertsByRegion []struct {
		Region string `json:"region"`
		Count  int    `json:"count"`
	} `json:"alerts_by_region"`
	AlertCorrelation []struct {
		Rule1 string `json:"rule1"`
		Rule2 string `json:"rule2"`
		Count int    `json:"count"`
	} `json:"alert_correlation"`
	AlertDuration []struct {
		DurationMinutes int `json:"duration_minutes"`
		Count           int `json:"count"`
	} `json:"alert_duration"`
	DashboardStats struct {
		TotalAlertsToday int `json:"total_alerts_today"`
		CriticalAlerts   int `json:"critical_alerts"`
		UniqueRules      int `json:"unique_rules"`
		ActiveHosts      int `json:"active_hosts"`
	} `json:"dashboard_stats"`
}

// BuildAnalyticsData aggregates all alerts and returns AnalyticsData for the dashboard.
func (s *RedisAlertStore) BuildAnalyticsData(ctx context.Context) (*AnalyticsData, error) {
	alerts, err := s.GetAllAlerts(ctx)
	if err != nil {
		return nil, err
	}

	// Helper maps for aggregation
	byTime := map[string]int{}
	byPriority := map[string]int{}
	ruleCounts := map[string]int{}
	byRuleTime := map[string]map[string]int{}
	byHost := map[string]int{}
	heatmap := map[string]map[int]int{}
	statusCounts := map[string]int{}
	userCounts := map[string]int{}
	regionCounts := map[string]int{}
	durationCounts := map[int]int{}
	// correlation := map[string]map[string]int{}
	ruleSet := map[string]struct{}{}
	hostSet := map[string]struct{}{}

	today := ""
	if len(alerts) > 0 {
		today = alerts[len(alerts)-1].Timestamp[:10] // YYYY-MM-DD
	}
	totalAlertsToday := 0
	criticalAlerts := 0

	for _, a := range alerts {
		// Alerts over time (hourly, RFC3339 rounded to hour)
		hour := ""
		if len(a.Timestamp) >= 20 {
			t, err := time.Parse(time.RFC3339, a.Timestamp)
			if err == nil {
				hour = t.Format("2006-01-02T15:00:00Z")
			} else {
				hour = a.Timestamp[:13] + ":00:00Z"
			}
		} else if len(a.Timestamp) >= 13 {
			hour = a.Timestamp[:13] + ":00:00Z"
		}
		byTime[hour]++

		// Alerts by priority
		byPriority[a.Priority]++
		if a.Priority == "critical" {
			criticalAlerts++
		}

		// Top rules
		ruleCounts[a.Rule]++
		ruleSet[a.Rule] = struct{}{}

		// Alerts by rule over time (use hour bucket)
		if _, ok := byRuleTime[hour]; !ok {
			byRuleTime[hour] = map[string]int{}
		}
		byRuleTime[hour][a.Rule]++

		// Alerts by host
		byHost[a.Host]++
		hostSet[a.Host] = struct{}{}

		// Heatmap (day/hour)
		if len(a.Timestamp) >= 20 {
			t, err := time.Parse(time.RFC3339, a.Timestamp)
			if err == nil {
				day := t.Weekday().String()
				hourOfDay := t.Hour()
				if _, ok := heatmap[day]; !ok {
					heatmap[day] = map[int]int{}
				}
				heatmap[day][hourOfDay]++
			}
		}

		// Alert status
		statusCounts[a.Status]++

		// Top users
		userCounts[a.User]++

		// Alerts by region
		regionCounts[a.Region]++

		// Alert duration
		durationCounts[a.DurationMin]++

		// Dashboard stats
		if today != "" && len(a.Timestamp) >= 10 && a.Timestamp[:10] == today {
			totalAlertsToday++
		}
	}

	// Build output
	data := &AnalyticsData{}
	// Alerts over time
	for ts, count := range byTime {
		if ts == "" {
			continue
		}
		data.AlertsOverTime = append(data.AlertsOverTime, struct {
			Timestamp string `json:"timestamp"`
			Count     int    `json:"count"`
		}{Timestamp: ts, Count: count})
	}
	// Alerts by priority
	for p, count := range byPriority {
		data.AlertsByPriority = append(data.AlertsByPriority, struct {
			Priority string `json:"priority"`
			Count    int    `json:"count"`
		}{Priority: p, Count: count})
	}
	// Top rules
	for r, count := range ruleCounts {
		data.TopRules = append(data.TopRules, struct {
			Rule  string `json:"rule"`
			Count int    `json:"count"`
		}{Rule: r, Count: count})
	}
	// Alerts by rule over time
	for ts, rules := range byRuleTime {
		if ts == "" {
			continue
		}
		for r, count := range rules {
			data.AlertsByRuleOverTime = append(data.AlertsByRuleOverTime, struct {
				Timestamp string `json:"timestamp"`
				Rule      string `json:"rule"`
				Count     int    `json:"count"`
			}{Timestamp: ts, Rule: r, Count: count})
		}
	}
	// Alerts by host
	for h, count := range byHost {
		data.AlertsByHost = append(data.AlertsByHost, struct {
			Host  string `json:"host"`
			Count int    `json:"count"`
		}{Host: h, Count: count})
	}
	// Heatmap
	for day, hours := range heatmap {
		for hour, count := range hours {
			data.AlertsHeatmap = append(data.AlertsHeatmap, struct {
				Day   string `json:"day"`
				Hour  int    `json:"hour"`
				Count int    `json:"count"`
			}{Day: day, Hour: hour, Count: count})
		}
	}
	// Alert status
	for s, count := range statusCounts {
		data.AlertStatus = append(data.AlertStatus, struct {
			Status string `json:"status"`
			Count  int    `json:"count"`
		}{Status: s, Count: count})
	}
	// Top users
	for u, count := range userCounts {
		data.TopUsers = append(data.TopUsers, struct {
			User  string `json:"user"`
			Count int    `json:"count"`
		}{User: u, Count: count})
	}
	// Alerts by region
	for r, count := range regionCounts {
		data.AlertsByRegion = append(data.AlertsByRegion, struct {
			Region string `json:"region"`
			Count  int    `json:"count"`
		}{Region: r, Count: count})
	}
	// Alert duration
	for d, count := range durationCounts {
		data.AlertDuration = append(data.AlertDuration, struct {
			DurationMinutes int `json:"duration_minutes"`
			Count           int `json:"count"`
		}{DurationMinutes: d, Count: count})
	}
	// Dashboard stats
	data.DashboardStats.TotalAlertsToday = totalAlertsToday
	data.DashboardStats.CriticalAlerts = criticalAlerts
	data.DashboardStats.UniqueRules = len(ruleSet)
	data.DashboardStats.ActiveHosts = len(hostSet)

	// Alert correlation: left as an exercise or can be implemented as needed

	return data, nil
}
