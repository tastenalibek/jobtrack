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
			id          SERIAL PRIMARY KEY,
			posted_by   INTEGER NOT NULL REFERENCES users(id),
			title       TEXT NOT NULL,
			company     TEXT NOT NULL,
			location    TEXT NOT NULL DEFAULT '',
			salary      TEXT NOT NULL DEFAULT '',
			type        TEXT NOT NULL DEFAULT 'full-time'
				CHECK (type IN ('full-time', 'part-time', 'remote', 'contract', 'internship')),
			description TEXT NOT NULL DEFAULT '',
			url         TEXT NOT NULL DEFAULT '',
			is_open     BOOLEAN NOT NULL DEFAULT true,
			created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
		);

		CREATE TABLE IF NOT EXISTS applications (
			id           SERIAL PRIMARY KEY,
			job_id       INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
			user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
			cover_letter TEXT NOT NULL DEFAULT '',
			status       TEXT NOT NULL DEFAULT 'pending'
				CHECK (status IN ('pending', 'reviewed', 'accepted', 'rejected')),
			stage        TEXT NOT NULL DEFAULT 'applied'
				CHECK (stage IN ('applied', 'interview', 'offer', 'rejected')),
			created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
			updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
			UNIQUE(job_id, user_id)
		);

		ALTER TABLE applications ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'applied'
			CHECK (stage IN ('applied', 'interview', 'offer', 'rejected'));
	`)
	return err
}
