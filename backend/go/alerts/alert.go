package alerts

// Alert represents a Falco alert event.
type Alert struct {
	Time      string `json:"time"`
	Priority  string `json:"priority"`
	Rule      string `json:"rule"`
	Output    string `json:"output"`
	Source    string `json:"source"`
	Tags      []string `json:"tags"`
	Hostname  string `json:"hostname"`
}
