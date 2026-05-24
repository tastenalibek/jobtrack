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
		r.Get("/jobs", h.ListJobs)
		r.Post("/jobs", h.CreateJob)
		r.Get("/jobs/{id}", h.GetJob)
		r.Put("/jobs/{id}", h.UpdateJob)
		r.Delete("/jobs/{id}", h.DeleteJob)
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
