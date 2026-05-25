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

func (h *Handler) Apply(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromCtx(r)
	jobID, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid job id")
		return
	}

	var req model.ApplyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	var isOpen bool
	err = h.db.QueryRowContext(r.Context(), `SELECT is_open FROM jobs WHERE id = $1`, jobID).Scan(&isOpen)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusNotFound, "job not found")
		return
	}
	if !isOpen {
		writeError(w, http.StatusBadRequest, "job is closed")
		return
	}

	var app model.Application
	err = h.db.QueryRowContext(r.Context(),
		`INSERT INTO applications (job_id, user_id, cover_letter)
		 VALUES ($1, $2, $3)
		 ON CONFLICT (job_id, user_id) DO NOTHING
		 RETURNING id, job_id, user_id, cover_letter, status, stage, created_at, updated_at`,
		jobID, userID, req.CoverLetter,
	).Scan(&app.ID, &app.JobID, &app.UserID, &app.CoverLetter, &app.Status, &app.Stage, &app.CreatedAt, &app.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		writeError(w, http.StatusConflict, "already applied to this job")
		return
	}
	if err != nil {
		writeError(w, http.StatusInternalServerError, "apply failed")
		return
	}

	writeJSON(w, http.StatusCreated, app)
}

func (h *Handler) MyApplications(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromCtx(r)
	statusFilter := r.URL.Query().Get("status")

	query := `
		SELECT a.id, a.job_id, a.user_id, a.cover_letter, a.status, a.stage, a.created_at, a.updated_at,
		       j.title, j.company, j.location, j.salary, j.type
		FROM applications a
		JOIN jobs j ON j.id = a.job_id
		WHERE a.user_id = $1`
	args := []any{userID}

	if statusFilter != "" {
		args = append(args, statusFilter)
		query += ` AND a.status = $2`
	}
	query += ` ORDER BY a.created_at DESC`

	rows, err := h.db.QueryContext(r.Context(), query, args...)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	apps := []model.Application{}
	for rows.Next() {
		var a model.Application
		j := &model.Job{}
		if err := rows.Scan(
			&a.ID, &a.JobID, &a.UserID, &a.CoverLetter, &a.Status, &a.Stage, &a.CreatedAt, &a.UpdatedAt,
			&j.Title, &j.Company, &j.Location, &j.Salary, &j.Type,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "scan failed")
			return
		}
		j.ID = a.JobID
		a.Job = j
		apps = append(apps, a)
	}
	writeJSON(w, http.StatusOK, apps)
}

func (h *Handler) WithdrawApplication(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromCtx(r)
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	res, err := h.db.ExecContext(r.Context(),
		`DELETE FROM applications WHERE id = $1 AND user_id = $2`, id, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "delete failed")
		return
	}
	if n, _ := res.RowsAffected(); n == 0 {
		writeError(w, http.StatusNotFound, "application not found")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *Handler) UpdateApplicationStage(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromCtx(r)
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var body struct {
		Stage string `json:"stage"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	switch body.Stage {
	case "applied", "interview", "offer", "rejected":
	default:
		writeError(w, http.StatusUnprocessableEntity, "invalid stage")
		return
	}

	var app model.Application
	err = h.db.QueryRowContext(r.Context(),
		`UPDATE applications SET stage=$1, updated_at=now()
		 WHERE id=$2 AND user_id=$3
		 RETURNING id, job_id, user_id, cover_letter, status, stage, created_at, updated_at`,
		body.Stage, id, userID,
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
