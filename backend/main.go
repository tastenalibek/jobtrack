package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"github.com/tastenalibek/jobtrack/internal/db"
	"github.com/tastenalibek/jobtrack/internal/handler"
)

func main() {
	database, err := db.Connect(os.Getenv("DATABASE_URL"))
	if err != nil {
		slog.Error("database connection failed", "err", err)
		os.Exit(1)
	}
	defer database.Close()

	if err := db.Migrate(database); err != nil {
		slog.Error("migration failed", "err", err)
		os.Exit(1)
	}

	h := handler.New(database)

	r := chi.NewRouter()
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"http://localhost:5173", "http://localhost:3000"},
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
	}))

	r.Post("/auth/register", h.Register)
	r.Post("/auth/login", h.Login)

	r.Group(func(r chi.Router) {
		r.Use(h.Auth)

		r.Get("/me", h.Me)
		r.Get("/stats", h.GetStats)

		// job browsing (users + admins)
		r.Get("/jobs", h.ListJobs)
		r.Get("/jobs/{id}", h.GetJob)

		// applications (users)
		r.Post("/jobs/{id}/apply", h.Apply)
		r.Get("/applications", h.MyApplications)

		// admin only
		r.Group(func(r chi.Router) {
			r.Use(h.AdminOnly)

			r.Get("/admin/jobs", h.AdminListJobs)
			r.Post("/admin/jobs", h.AdminCreateJob)
			r.Put("/admin/jobs/{id}", h.AdminUpdateJob)
			r.Delete("/admin/jobs/{id}", h.AdminDeleteJob)
			r.Get("/admin/jobs/{id}/applicants", h.AdminJobApplicants)
			r.Put("/admin/applications/{id}/status", h.AdminUpdateApplicationStatus)

			r.Get("/admin/users", h.ListUsers)
			r.Delete("/admin/users/{id}", h.DeleteUser)
			r.Put("/admin/users/{id}/role", h.UpdateUserRole)
		})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	slog.Info("server starting", "port", port)
	if err := http.ListenAndServe(":"+port, r); err != nil {
		slog.Error("server error", "err", err)
		os.Exit(1)
	}
}
