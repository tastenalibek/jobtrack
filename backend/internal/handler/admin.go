package handler

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/tastenalibek/jobtrack/internal/model"
)

func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.QueryContext(r.Context(),
		`SELECT u.id, u.name, u.email, u.role, u.created_at,
		 COUNT(j.id) AS job_count
		 FROM users u
		 LEFT JOIN jobs j ON j.user_id = u.id
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
		`UPDATE users SET role = $1 WHERE id = $2
		 RETURNING id, name, email, role, created_at`,
		body.Role, id,
	).Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.CreatedAt)
	if err != nil {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}
	writeJSON(w, http.StatusOK, u)
}

func (h *Handler) ListAllJobs(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.QueryContext(r.Context(),
		`SELECT j.id, j.company, j.position, j.location, j.salary, j.status,
		 j.url, j.notes, to_char(j.applied_at, 'YYYY-MM-DD'), j.created_at, j.updated_at,
		 u.name, u.email
		 FROM jobs j JOIN users u ON j.user_id = u.id
		 ORDER BY j.created_at DESC`)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	type jobWithUser struct {
		model.Job
		UserName  string `json:"user_name"`
		UserEmail string `json:"user_email"`
	}

	jobs := []jobWithUser{}
	for rows.Next() {
		var j jobWithUser
		if err := rows.Scan(
			&j.ID, &j.Company, &j.Position, &j.Location, &j.Salary, &j.Status,
			&j.URL, &j.Notes, &j.AppliedAt, &j.CreatedAt, &j.UpdatedAt,
			&j.UserName, &j.UserEmail,
		); err != nil {
			writeError(w, http.StatusInternalServerError, "scan failed")
			return
		}
		jobs = append(jobs, j)
	}
	writeJSON(w, http.StatusOK, jobs)
}
