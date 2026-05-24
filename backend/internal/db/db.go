package db

import (
	"database/sql"
	"fmt"

	_ "github.com/lib/pq"
)

func Connect(dsn string) (*sql.DB, error) {
	database, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("open: %w", err)
	}
	if err := database.Ping(); err != nil {
		return nil, fmt.Errorf("ping: %w", err)
	}
	database.SetMaxOpenConns(25)
	database.SetMaxIdleConns(5)
	return database, nil
}

func Migrate(database *sql.DB) error {
	_, err := database.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			id            SERIAL PRIMARY KEY,
			name          TEXT NOT NULL,
			email         TEXT UNIQUE NOT NULL,
			password_hash TEXT NOT NULL,
			role          TEXT NOT NULL DEFAULT 'user'
				CHECK (role IN ('user', 'admin')),
			created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
		);

		ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

		CREATE TABLE IF NOT EXISTS jobs (
			id         SERIAL PRIMARY KEY,
			user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			company    TEXT NOT NULL,
			position   TEXT NOT NULL,
			location   TEXT NOT NULL DEFAULT '',
			salary     TEXT NOT NULL DEFAULT '',
			status     TEXT NOT NULL DEFAULT 'applied'
				CHECK (status IN ('applied', 'interview', 'offer', 'rejected')),
			url        TEXT NOT NULL DEFAULT '',
			notes      TEXT NOT NULL DEFAULT '',
			applied_at DATE NOT NULL DEFAULT CURRENT_DATE,
			created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
		);
	`)
	return err
}
