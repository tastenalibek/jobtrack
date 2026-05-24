package model

import "time"

type Job struct {
	ID             int       `json:"id"`
	PostedBy       int       `json:"posted_by"`
	Title          string    `json:"title"`
	Company        string    `json:"company"`
	Location       string    `json:"location"`
	Salary         string    `json:"salary"`
	Type           string    `json:"type"`
	Description    string    `json:"description"`
	URL            string    `json:"url"`
	IsOpen         bool      `json:"is_open"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
	ApplicantCount int       `json:"applicant_count,omitempty"`
	HasApplied     bool      `json:"has_applied,omitempty"`
}

type JobRequest struct {
	Title       string `json:"title"`
	Company     string `json:"company"`
	Location    string `json:"location"`
	Salary      string `json:"salary"`
	Type        string `json:"type"`
	Description string `json:"description"`
	URL         string `json:"url"`
	IsOpen      bool   `json:"is_open"`
}

type Stats struct {
	TotalJobs         int `json:"total_jobs"`
	OpenJobs          int `json:"open_jobs"`
	TotalApplications int `json:"total_applications"`
	MyApplications    int `json:"my_applications"`
}
