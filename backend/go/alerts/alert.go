package alerts

// Alert represents a Falco alert event received from Falco gRPC.
type Alert struct {
	Time     string   `json:"time"`
	Priority string   `json:"priority"`
	Rule     string   `json:"rule"`
	Output   string   `json:"output"`
	Source   string   `json:"source"`
	Tags     []string `json:"tags"`
	Hostname string   `json:"hostname"`
}

// AlertRecord is used for analytics and persistent storage (e.g., Redis).
type AlertRecord struct {
	ID          int    `db:"id" json:"id"`
	Timestamp   string `db:"timestamp" json:"timestamp"`
	Priority    string `db:"priority" json:"priority"`
	Rule        string `db:"rule" json:"rule"`
	Host        string `db:"host" json:"host"`
	User        string `db:"user" json:"user"`
	Region      string `db:"region" json:"region"`
	Status      string `db:"status" json:"status"`
	DurationMin int    `db:"duration_minutes" json:"duration_minutes"`
}

// PriorityCount is used for analytics: alerts by priority.
type PriorityCount struct {
	Priority string `json:"priority"`
	Count    int    `json:"count"`
}

// RedisAlertPrefix is the key prefix for alert records in Redis.
const RedisAlertPrefix = "alert:"
