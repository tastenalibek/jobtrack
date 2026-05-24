package model

import "time"

type Application struct {
	ID          int       `json:"id"`
	JobID       int       `json:"job_id"`
	UserID      int       `json:"user_id"`
	CoverLetter string    `json:"cover_letter"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	Job         *Job      `json:"job,omitempty"`
	UserName    string    `json:"user_name,omitempty"`
	UserEmail   string    `json:"user_email,omitempty"`
}

type ApplyRequest struct {
	CoverLetter string `json:"cover_letter"`
}
