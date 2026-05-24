package handler

import (
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/tastenalibek/jobtrack/internal/model"
)

func (h *Handler) ListJobs(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromCtx(r)
	q := r.URL.Query().Get("q")
	jobType := r.URL.Query().Get("type")
	location := r.URL.Query().Get("location")

	query := `
		SELECT j.id, j.posted_by, j.title, j.company, j.location, j.salary,
		       j.type, j.description, j.url, j.is_open, j.created_at, j.updated_at,
		       COUNT(a.id) AS applicant_count,
		       BOOL_OR(a.user_id = $1) AS has_applied
		FROM jobs j
		LEFT JOIN applications a ON a.job_id = j.id
		WHERE j.is_open = true`
	args := []any{userID}

	if q != "" {
		args = append(args, "%"+q+"%")
		n := strconv.Itoa(len(args))
		query += " AND (j.title ILIKE $" + n + " OR j.company ILIKE $" + n + " OR j.description ILIKE $" + n + ")"
	}
	if jobType != "" {
		args = append(args, jobType)
		query += " AND j.type = $" + strconv.Itoa(len(args))
	}
	if location != "" {
		args = append(args, "%"+location+"%")
		query += " AND j.location ILIKE $" + strconv.Itoa(len(args))
	}
	query += " GROUP BY j.id ORDER BY j.created_at DESC"

	rows, err := h.db.QueryContext(r.Context(), query, args...)
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
			&j.ApplicantCount, &j.HasApplied,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "scan failed")
			return
		}
		jobs = append(jobs, j)
	}
	writeJSON(w, http.StatusOK, jobs)
}

func (h *Handler) GetJob(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromCtx(r)
	id, err := strconv.Atoi(chi.URLParam(r, "id"))
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid id")
		return
	}

	var j model.Job
	err = h.db.QueryRowContext(r.Context(), `
		SELECT j.id, j.posted_by, j.title, j.company, j.location, j.salary,
		       j.type, j.description, j.url, j.is_open, j.created_at, j.updated_at,
		       COUNT(a.id), BOOL_OR(a.user_id = $1)
		FROM jobs j
		LEFT JOIN applications a ON a.job_id = j.id
		WHERE j.id = $2
		GROUP BY j.id`, userID, id,
	).Scan(&j.ID, &j.PostedBy, &j.Title, &j.Company, &j.Location, &j.Salary,
		&j.Type, &j.Description, &j.URL, &j.IsOpen, &j.CreatedAt, &j.UpdatedAt,
		&j.ApplicantCount, &j.HasApplied)
	if err != nil {
		writeError(w, http.StatusNotFound, "job not found")
		return
	}
	writeJSON(w, http.StatusOK, j)
}

func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromCtx(r)
	role := roleFromCtx(r)

	var stats model.Stats

	h.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM jobs`).Scan(&stats.TotalJobs)
	h.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM jobs WHERE is_open = true`).Scan(&stats.OpenJobs)
	h.db.QueryRowContext(r.Context(), `SELECT COUNT(*) FROM applications`).Scan(&stats.TotalApplications)

	if role != "admin" {
		h.db.QueryRowContext(r.Context(),
			`SELECT COUNT(*) FROM applications WHERE user_id = $1`, userID,
		).Scan(&stats.MyApplications)
	}

	writeJSON(w, http.StatusOK, stats)
}
