package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/tastenalibek/jobtrack/internal/model"
)

// ── Job management ───────────────────────────────────────────────────────────

func (h *Handler) AdminCreateJob(w http.ResponseWriter, r *http.Request) {
	adminID := userIDFromCtx(r)

	var req model.JobRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if req.Title == "" || req.Company == "" {
		writeError(w, http.StatusUnprocessableEntity, "title and company are required")
		return
	}
	if req.Type == "" {
		req.Type = "full-time"
	}

	var j model.Job
	err := h.db.QueryRowContext(r.Context(),
		`INSERT INTO jobs (posted_by, title, company, location, salary, type, description, url, is_open)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
		 RETURNING id, posted_by, title, company, location, salary, type, description, url, is_open, created_at, updated_at`,
		adminID, req.Title, req.Company, req.Location, req.Salary,
		req.Type, req.Description, req.URL, req.IsOpen,
	).Scan(&j.ID, &j.PostedBy, &j.Title, &j.Company, &j.Location, &j.Salary,
		&j.Type, &j.Description, &j.URL, &j.IsOpen, &j.CreatedAt, &j.UpdatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "insert failed")
		return
	}
	writeJSON(w, http.StatusCreated, j)
}

func (h *Handler) AdminUpdateJob(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var req model.JobRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if req.Title == "" || req.Company == "" {
		writeError(w, http.StatusUnprocessableEntity, "title and company are required")
		return
	}

	var j model.Job
	err = h.db.QueryRowContext(r.Context(),
		`UPDATE jobs SET title=$1, company=$2, location=$3, salary=$4, type=$5,
		 description=$6, url=$7, is_open=$8, updated_at=now()
		 WHERE id=$9
		 RETURNING id, posted_by, title, company, location, salary, type, description, url, is_open, created_at, updated_at`,
		req.Title, req.Company, req.Location, req.Salary, req.Type,
		req.Description, req.URL, req.IsOpen, id,
	).Scan(&j.ID, &j.PostedBy, &j.Title, &j.Company, &j.Location, &j.Salary,
		&j.Type, &j.Description, &j.URL, &j.IsOpen, &j.CreatedAt, &j.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusNotFound, "job not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "update failed")
		return
	}
	writeJSON(w, http.StatusOK, j)
}

func (h *Handler) AdminDeleteJob(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	res, err := h.db.ExecContext(r.Context(), `DELETE FROM jobs WHERE id = $1`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "delete failed")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		writeError(w, http.StatusNotFound, "job not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) AdminListJobs(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.QueryContext(r.Context(), `
		SELECT j.id, j.posted_by, j.title, j.company, j.location, j.salary,
		       j.type, j.description, j.url, j.is_open, j.created_at, j.updated_at,
		       COUNT(a.id) AS applicant_count
		FROM jobs j
		LEFT JOIN applications a ON a.job_id = j.id
		GROUP BY j.id ORDER BY j.created_at DESC`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	jobs := []model.Job{}
	for rows.Next() {
		var j model.Job
		if err := rows.Scan(
			&j.ID, &j.PostedBy, &j.Title, &j.Company, &j.Location, &j.Salary,
			&j.Type, &j.Description, &j.URL, &j.IsOpen, &j.CreatedAt, &j.UpdatedAt,
			&j.ApplicantCount,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "scan failed")
			return
		}
		jobs = append(jobs, j)
	}
	writeJSON(w, http.StatusOK, jobs)
}

func (h *Handler) AdminJobApplicants(w http.ResponseWriter, r *http.Request) {
	jobID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	rows, err := h.db.QueryContext(r.Context(), `
		SELECT a.id, a.job_id, a.user_id, a.cover_letter, a.status, a.stage, a.created_at, a.updated_at,
		       u.name, u.email
		FROM applications a
		JOIN users u ON u.id = a.user_id
		WHERE a.job_id = $1
		ORDER BY a.created_at DESC`, jobID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	apps := []model.Application{}
	for rows.Next() {
		var a model.Application
		if err := rows.Scan(
			&a.ID, &a.JobID, &a.UserID, &a.CoverLetter, &a.Status, &a.Stage, &a.CreatedAt, &a.UpdatedAt,
			&a.UserName, &a.UserEmail,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "scan failed")
			return
		}
		apps = append(apps, a)
	}
	writeJSON(w, http.StatusOK, apps)
}

func (h *Handler) AdminUpdateApplicationStatus(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var body struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	switch body.Status {
	case "pending", "reviewed", "accepted", "rejected":
	default:
		writeError(w, http.StatusUnprocessableEntity, "invalid status")
		return
	}

	var app model.Application
	err = h.db.QueryRowContext(r.Context(),
		`UPDATE applications SET status=$1, updated_at=now()
		 WHERE id=$2
		 RETURNING id, job_id, user_id, cover_letter, status, stage, created_at, updated_at`,
		body.Status, id,
	).Scan(&app.ID, &app.JobID, &app.UserID, &app.CoverLetter, &app.Status, &app.Stage, &app.CreatedAt, &app.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusNotFound, "application not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "update failed")
		return
	}
	writeJSON(w, http.StatusOK, app)
}

// ── User management ──────────────────────────────────────────────────────────

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.QueryContext(r.Context(),
		`SELECT u.id, u.name, u.email, u.role, u.created_at,
		 COUNT(a.id) AS job_count
		 FROM users u
		 LEFT JOIN applications a ON a.user_id = u.id
		 GROUP BY u.id ORDER BY u.created_at ASC`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	users := []model.AdminUser{}
	for rows.Next() {
		var u model.AdminUser
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt, &u.JobCount); err != nil {
			writeError(w, http.StatusInternalServerError, "scan failed")
			return
		}
		users = append(users, u)
	}
	writeJSON(w, http.StatusOK, users)
}

func (h *Handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	callerID := userIDFromCtx(r)
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if id == callerID {
		writeError(w, http.StatusBadRequest, "cannot delete your own account")
		return
	}

	res, err := h.db.ExecContext(r.Context(), `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "delete failed")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) UpdateUserRole(w http.ResponseWriter, r *http.Request) {
	callerID := userIDFromCtx(r)
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}
	if id == callerID {
		writeError(w, http.StatusBadRequest, "cannot change your own role")
		return
	}

	var body struct {
		Role string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if body.Role != "user" && body.Role != "admin" {
		writeError(w, http.StatusUnprocessableEntity, "role must be user or admin")
		return
	}

	var u model.User
	err = h.db.QueryRowContext(r.Context(),
		`UPDATE users SET role=$1 WHERE id=$2
		 RETURNING id, name, email, role, created_at`,
		body.Role, id,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	writeJSON(w, http.StatusOK, u)
}
