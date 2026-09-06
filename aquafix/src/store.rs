//! Lead persistence. Server-only.
//!
//! The store is the commit point of the funnel: `insert` must succeed before a
//! visitor is told their price is coming, and a notification failure after it
//! must never turn a durable lead into a lost one.

use sqlx::{Row, sqlite::SqlitePoolOptions};
use std::path::Path;

use crate::quote::Lead;

#[derive(Clone)]
pub struct Store {
	pool: sqlx::SqlitePool,
}

impl Store {
	/// Opens (creating if absent) and brings the schema current.
	pub async fn open(path: &Path) -> Result<Self, sqlx::Error> {
		if let Some(dir) = path.parent() {
			std::fs::create_dir_all(dir).expect("create the DB directory");
		}
		let pool = SqlitePoolOptions::new().connect(&format!("sqlite://{}?mode=rwc", path.display())).await?;
		sqlx::query(
			"CREATE TABLE IF NOT EXISTS leads (
				id      INTEGER PRIMARY KEY AUTOINCREMENT,
				job     TEXT NOT NULL,
				zip     TEXT NOT NULL,
				mobile  TEXT NOT NULL,
				at      TEXT NOT NULL DEFAULT (datetime('now'))
			)",
		)
		.execute(&pool)
		.await?;
		Ok(Self { pool })
	}

	pub async fn insert(&self, lead: &Lead) -> Result<i64, sqlx::Error> {
		let row = sqlx::query("INSERT INTO leads (job, zip, mobile) VALUES (?, ?, ?) RETURNING id")
			.bind(&lead.job)
			.bind(&lead.zip)
			.bind(&lead.mobile)
			.fetch_one(&self.pool)
			.await?;
		let id: i64 = row.get("id");
		tracing::info!(lead = id, job = %lead.job, "lead stored");
		Ok(id)
	}

	pub async fn count(&self) -> Result<i64, sqlx::Error> {
		let row = sqlx::query("SELECT COUNT(*) AS n FROM leads").fetch_one(&self.pool).await?;
		Ok(row.get("n"))
	}
}

//DO: SMTP and SMS delivery, reading `SMTP_URL` / `SMS_TOKEN` (see
// tmp/site_dev_plans/deploy.md). Called only after `insert` has returned, and
// deliberately infallible from the caller's side: a lead that is on disk but
// un-notified is a recoverable problem, and a 500 shown to a customer whose
// lead we already hold is not.
pub fn notify(lead: &Lead) {
	tracing::warn!(job = %lead.job, "lead notification not configured; lead is stored and unsent");
}
