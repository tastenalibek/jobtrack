package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/tastenalibek/jobtrack/internal/model"
)

func (h *Handler) ListJobs(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromCtx(r)
	status := r.URL.Query().Get("status")
	search := r.URL.Query().Get("q")

	query := `SELECT id, company, position, location, salary, status, url, notes,
	          to_char(applied_at, 'YYYY-MM-DD'), created_at, updated_at
	          FROM jobs WHERE user_id = $1`
	args := []any{userID}

	if status != "" {
		args = append(args, status)
		query += " AND status = $" + strconv.Itoa(len(args))
	}
	if search != "" {
		args = append(args, "%"+search+"%")
		n := strconv.Itoa(len(args))
		query += " AND (company ILIKE $" + n + " OR position ILIKE $" + n + ")"
	}
	query += " ORDER BY created_at DESC"

	rows, err := h.db.QueryContext(r.Context(), query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	jobs := []model.Job{}
	for rows.Next() {
		var j model.Job
		if err := rows.Scan(&j.ID, &j.Company, &j.Position, &j.Location,
			&j.Salary, &j.Status, &j.URL, &j.Notes,
			&j.AppliedAt, &j.CreatedAt, &j.UpdatedAt); err != nil {
			writeError(w, http.StatusInternalServerError, "scan failed")
			return
		}
		jobs = append(jobs, j)
	}

	writeJSON(w, http.StatusOK, jobs)
}

func (h *Handler) CreateJob(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromCtx(r)

	var req model.JobRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if req.Company == "" || req.Position == "" {
		writeError(w, http.StatusUnprocessableEntity, "company and position are required")
		return
	}
	if req.Status == "" {
		req.Status = "applied"
	}
	if req.AppliedAt == "" {
		req.AppliedAt = time.Now().Format("2006-01-02")
	}

	var j model.Job
	err := h.db.QueryRowContext(r.Context(),
		`INSERT INTO jobs (user_id, company, position, location, salary, status, url, notes, applied_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::date)
		 RETURNING id, company, position, location, salary, status, url, notes,
		 to_char(applied_at, 'YYYY-MM-DD'), created_at, updated_at`,
		userID, req.Company, req.Position, req.Location, req.Salary,
		req.Status, req.URL, req.Notes, req.AppliedAt,
	).Scan(&j.ID, &j.Company, &j.Position, &j.Location, &j.Salary,
		&j.Status, &j.URL, &j.Notes, &j.AppliedAt, &j.CreatedAt, &j.UpdatedAt)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "insert failed")
		return
	}

	writeJSON(w, http.StatusCreated, j)
}

func (h *Handler) GetJob(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromCtx(r)
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var j model.Job
	err = h.db.QueryRowContext(r.Context(),
		`SELECT id, company, position, location, salary, status, url, notes,
		 to_char(applied_at, 'YYYY-MM-DD'), created_at, updated_at
		 FROM jobs WHERE id = $1 AND user_id = $2`,
		id, userID,
	).Scan(&j.ID, &j.Company, &j.Position, &j.Location, &j.Salary,
		&j.Status, &j.URL, &j.Notes, &j.AppliedAt, &j.CreatedAt, &j.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusNotFound, "job not found")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query failed")
		return
	}

	writeJSON(w, http.StatusOK, j)
}

func (h *Handler) UpdateJob(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromCtx(r)
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
	if req.Company == "" || req.Position == "" {
		writeError(w, http.StatusUnprocessableEntity, "company and position are required")
		return
	}
	if req.AppliedAt == "" {
		req.AppliedAt = time.Now().Format("2006-01-02")
	}

	var j model.Job
	err = h.db.QueryRowContext(r.Context(),
		`UPDATE jobs SET company=$1, position=$2, location=$3, salary=$4, status=$5,
		 url=$6, notes=$7, applied_at=$8::date, updated_at=now()
		 WHERE id=$9 AND user_id=$10
		 RETURNING id, company, position, location, salary, status, url, notes,
		 to_char(applied_at, 'YYYY-MM-DD'), created_at, updated_at`,
		req.Company, req.Position, req.Location, req.Salary, req.Status,
		req.URL, req.Notes, req.AppliedAt, id, userID,
	).Scan(&j.ID, &j.Company, &j.Position, &j.Location, &j.Salary,
		&j.Status, &j.URL, &j.Notes, &j.AppliedAt, &j.CreatedAt, &j.UpdatedAt)
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

func (h *Handler) DeleteJob(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromCtx(r)
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	res, err := h.db.ExecContext(r.Context(),
		`DELETE FROM jobs WHERE id = $1 AND user_id = $2`, id, userID)
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
