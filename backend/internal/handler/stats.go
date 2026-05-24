package handler

import (
	"net/http"

	"github.com/tastenalibek/jobtrack/internal/model"
)

func (h *Handler) GetStats(w http.ResponseWriter, r *http.Request) {
	userID := userIDFromCtx(r)

	rows, err := h.db.QueryContext(r.Context(),
		`SELECT status, COUNT(*) FROM jobs WHERE user_id = $1 GROUP BY status`, userID)
	if err != nil {
		writeError(w, http.StatusInternalServerError, "query failed")
		return
	}
	defer rows.Close()

	stats := model.Stats{ByStatus: make(map[string]int)}
	for rows.Next() {
		var status string
		var count int
		if err := rows.Scan(&status, &count); err != nil {
			continue
		}
		stats.ByStatus[status] = count
		stats.Total += count
	}

	h.db.QueryRowContext(r.Context(),
		`SELECT COUNT(*) FROM jobs WHERE user_id=$1 AND created_at >= now()-interval '7 days'`,
		userID).Scan(&stats.ThisWeek)

	h.db.QueryRowContext(r.Context(),
		`SELECT COUNT(*) FROM jobs WHERE user_id=$1 AND created_at >= now()-interval '30 days'`,
		userID).Scan(&stats.ThisMonth)

	writeJSON(w, http.StatusOK, stats)
}
