CREATE TABLE IF NOT EXISTS conferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    edition TEXT,
    description TEXT,
    logo_url TEXT,
    website_url TEXT,
    location TEXT,
    start_date DATE,
    end_date DATE,
    submission_deadline DATE NOT NULL,
    notification_date DATE,
    camera_ready_date DATE,
    is_active BOOLEAN DEFAULT 1,
    is_double_blind BOOLEAN DEFAULT 1,
    min_reviewers INTEGER DEFAULT 2,
    max_file_size_mb INTEGER DEFAULT 10,
    custom_fields TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conference_id INTEGER NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    affiliation TEXT,
    role TEXT NOT NULL DEFAULT 'author',
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conference_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conference_id INTEGER NOT NULL REFERENCES conferences(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'reviewer',
    tracks TEXT,
    UNIQUE(conference_id, user_id)
);

CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conference_id INTEGER NOT NULL REFERENCES conferences(id),
    tracking_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    authors_json TEXT NOT NULL,
    abstract TEXT NOT NULL,
    keywords TEXT,
    track_id INTEGER REFERENCES tracks(id),
    file_path TEXT,
    file_original_name TEXT,
    status TEXT NOT NULL DEFAULT 'submitted',
    decision_notes TEXT,
    submitted_by_email TEXT NOT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS review_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id),
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deadline DATE,
    status TEXT DEFAULT 'pending',
    UNIQUE(submission_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    reviewer_id INTEGER NOT NULL REFERENCES users(id),
    overall_score INTEGER NOT NULL CHECK(overall_score BETWEEN 1 AND 10),
    originality_score INTEGER CHECK(originality_score BETWEEN 1 AND 10),
    technical_score INTEGER CHECK(technical_score BETWEEN 1 AND 10),
    clarity_score INTEGER CHECK(clarity_score BETWEEN 1 AND 10),
    relevance_score INTEGER CHECK(relevance_score BETWEEN 1 AND 10),
    recommendation TEXT NOT NULL,
    comments_to_authors TEXT NOT NULL,
    comments_to_chairs TEXT,
    confidence INTEGER CHECK(confidence BETWEEN 1 AND 5),
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(submission_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS email_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conference_id INTEGER REFERENCES conferences(id),
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    template TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_conference ON submissions(conference_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_tracking ON submissions(tracking_code);
CREATE INDEX IF NOT EXISTS idx_reviews_submission ON reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_tracks_conference ON tracks(conference_id);
CREATE INDEX IF NOT EXISTS idx_conference_members ON conference_members(conference_id, user_id);
