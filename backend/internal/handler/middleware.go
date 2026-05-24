package handler

import (
	"context"
	"net/http"
	"strings"

	"github.com/tastenalibek/jobtrack/internal/auth"
)

type contextKey string

const userIDKey contextKey = "userID"

func (h *Handler) Auth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := r.Header.Get("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			writeError(w, http.StatusUnauthorized, "missing authorization header")
			return
		}

		claims, err := auth.ValidateToken(strings.TrimPrefix(header, "Bearer "))
		if err != nil {
			writeError(w, http.StatusUnauthorized, "invalid token")
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

func userIDFromCtx(r *http.Request) int {
	id, _ := r.Context().Value(userIDKey).(int)
	return id
}
