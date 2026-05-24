package model

import "time"

type Job struct {
	ID        int       `json:"id"`
	Company   string    `json:"company"`
	Position  string    `json:"position"`
	Location  string    `json:"location"`
	Salary    string    `json:"salary"`
	Status    string    `json:"status"`
	URL       string    `json:"url"`
	Notes     string    `json:"notes"`
	AppliedAt string    `json:"applied_at"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type JobRequest struct {
	Company   string `json:"company"`
	Position  string `json:"position"`
	Location  string `json:"location"`
	Salary    string `json:"salary"`
	Status    string `json:"status"`
	URL       string `json:"url"`
	Notes     string `json:"notes"`
	AppliedAt string `json:"applied_at"`
}

type Stats struct {
	Total     int            `json:"total"`
	ByStatus  map[string]int `json:"by_status"`
	ThisWeek  int            `json:"this_week"`
	ThisMonth int            `json:"this_month"`
}
