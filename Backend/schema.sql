-- ============================================================
-- Pedestal Backend – Supabase PostgreSQL Schema
-- Reinforced Learning Stack
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. USER PROFILES
-- References Supabase Auth uid
-- ============================================================
CREATE TABLE user_profiles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_uid        UUID NOT NULL UNIQUE,  -- references auth.users(id)
    display_name    TEXT,
    avatar_url      TEXT,
    email           TEXT,

    -- Gamification
    xp_total        INTEGER NOT NULL DEFAULT 0,
    level           INTEGER NOT NULL DEFAULT 1,
    streak_days     INTEGER NOT NULL DEFAULT 0,

    -- Adaptive scores (0-100 scale)
    risk_score      FLOAT NOT NULL DEFAULT 50.0,
    discipline_score FLOAT NOT NULL DEFAULT 50.0,
    knowledge_score FLOAT NOT NULL DEFAULT 50.0,
    stability_score FLOAT NOT NULL DEFAULT 50.0,

    -- Onboarding
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    assigned_track_id    UUID,

    -- Difficulty tracking
    current_difficulty_level INTEGER NOT NULL DEFAULT 1,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_auth_uid ON user_profiles(auth_uid);

-- ============================================================
-- 2. TRACKS
-- ============================================================
CREATE TABLE tracks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           TEXT NOT NULL,
    description     TEXT,
    category        TEXT NOT NULL,           -- e.g. 'investing', 'budgeting', 'crypto'
    difficulty      INTEGER NOT NULL DEFAULT 1,  -- 1=beginner, 2=intermediate, 3=advanced
    order_index     INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    icon_url        TEXT,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tracks_category ON tracks(category);
CREATE INDEX idx_tracks_order ON tracks(order_index);

-- Add FK from user_profiles now that tracks exists
ALTER TABLE user_profiles
    ADD CONSTRAINT fk_user_profiles_track
    FOREIGN KEY (assigned_track_id) REFERENCES tracks(id)
    ON DELETE SET NULL;

-- ============================================================
-- 3. LESSONS
-- ============================================================
CREATE TABLE lessons (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id        UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    difficulty_level INTEGER NOT NULL DEFAULT 1,
    energy_cost     INTEGER NOT NULL DEFAULT 10,
    xp_reward       INTEGER NOT NULL DEFAULT 25,
    order_index     INTEGER NOT NULL DEFAULT 0,
    has_video       BOOLEAN NOT NULL DEFAULT FALSE,
    video_url       TEXT,
    estimated_duration_seconds INTEGER DEFAULT 60,
    is_remedial     BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lessons_track ON lessons(track_id);
CREATE INDEX idx_lessons_difficulty ON lessons(difficulty_level);
CREATE INDEX idx_lessons_order ON lessons(track_id, order_index);

-- ============================================================
-- 4. LESSON BLOCKS
-- Flexible content blocks stored as JSONB
-- ============================================================
CREATE TABLE lesson_blocks (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    block_type      TEXT NOT NULL,  -- 'video', 'audio', 'text', 'quiz', 'flashcard', 'live_data'
    order_index     INTEGER NOT NULL DEFAULT 0,

    -- JSONB content – structure depends on block_type:
    --   video:     { "url": "...", "duration_seconds": 15, "thumbnail_url": "..." }
    --   audio:     { "url": "...", "duration_seconds": 30, "transcript": "..." }
    --   text:      { "body": "...", "highlights": [...] }
    --   quiz:      { "questions": [{ "q": "...", "options": [...], "correct": 0 }] }
    --   flashcard: { "cards": [{ "front": "...", "back": "..." }] }
    --   live_data: { "widget_type": "stock_price", "symbol": "AAPL", "config": {...} }
    content         JSONB NOT NULL DEFAULT '{}',

    is_active       BOOLEAN NOT NULL DEFAULT TRUE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lesson_blocks_lesson ON lesson_blocks(lesson_id);
CREATE INDEX idx_lesson_blocks_order ON lesson_blocks(lesson_id, order_index);
CREATE INDEX idx_lesson_blocks_content ON lesson_blocks USING GIN (content);

-- ============================================================
-- 5. USER PROGRESS
-- ============================================================
CREATE TABLE user_progress (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL,  -- references user_profiles.id
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    quiz_score      FLOAT,
    attempts        INTEGER NOT NULL DEFAULT 0,
    best_score      FLOAT,
    xp_earned       INTEGER NOT NULL DEFAULT 0,

    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Idempotent: one record per user+lesson
    CONSTRAINT uq_user_lesson UNIQUE (user_id, lesson_id),
    CONSTRAINT fk_user_progress_user FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_progress_user ON user_progress(user_id);
CREATE INDEX idx_user_progress_lesson ON user_progress(lesson_id);
CREATE INDEX idx_user_progress_completed ON user_progress(user_id, is_completed);

-- ============================================================
-- 6. USER ENERGY
-- ============================================================
CREATE TABLE user_energy (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE,  -- references user_profiles.id
    current_energy  INTEGER NOT NULL DEFAULT 100,
    max_energy      INTEGER NOT NULL DEFAULT 100,
    regen_rate      INTEGER NOT NULL DEFAULT 5,          -- energy points per interval
    regen_interval_seconds INTEGER NOT NULL DEFAULT 1800, -- 30 minutes

    last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_energy_user FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_energy_user ON user_energy(user_id);

-- ============================================================
-- 7. QUIZ ATTEMPTS
-- ============================================================
CREATE TABLE quiz_attempts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL,
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

    answers         JSONB NOT NULL DEFAULT '[]',  -- [{ "question_index": 0, "selected": 2, "correct": true }]
    score           FLOAT NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    passed          BOOLEAN NOT NULL DEFAULT FALSE,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_quiz_attempts_user FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_lesson ON quiz_attempts(lesson_id);
CREATE INDEX idx_quiz_attempts_user_lesson ON quiz_attempts(user_id, lesson_id);

-- ============================================================
-- 8. REINFORCEMENT QUEUE
-- ============================================================
CREATE TABLE reinforcement_queue (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL,
    lesson_id       UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,

    queue_type      TEXT NOT NULL DEFAULT 'lesson',  -- 'lesson' or 'flashcard'
    priority        INTEGER NOT NULL DEFAULT 0,      -- higher = more urgent
    reason          TEXT,                             -- e.g. 'low_quiz_score', 'spaced_repetition'
    is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
    source_quiz_attempt_id UUID REFERENCES quiz_attempts(id),

    scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_reinforcement_user FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_reinforcement_user ON reinforcement_queue(user_id);
CREATE INDEX idx_reinforcement_pending ON reinforcement_queue(user_id, is_completed)
    WHERE is_completed = FALSE;

-- ============================================================
-- 9. ONBOARDING RESPONSES
-- ============================================================
CREATE TABLE onboarding_responses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE,
    responses       JSONB NOT NULL DEFAULT '{}',  -- { "q1": "answer", "q2": "answer" }
    assigned_track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
    computed_scores JSONB,  -- { "risk": 60, "discipline": 70, "knowledge": 40, "stability": 55 }

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_onboarding_user FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE INDEX idx_onboarding_user ON onboarding_responses(user_id);

-- ============================================================
-- Updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tracks_updated_at
    BEFORE UPDATE ON tracks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_lessons_updated_at
    BEFORE UPDATE ON lessons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Row Level Security (RLS) policies – enable per table
-- Users can only access their own data
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_energy ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reinforcement_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (adjust for your Supabase setup)
CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth_uid = auth.uid());

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth_uid = auth.uid());

CREATE POLICY "Users can view own energy"
    ON user_energy FOR SELECT
    USING (user_id IN (SELECT id FROM user_profiles WHERE auth_uid = auth.uid()));

CREATE POLICY "Users can view own progress"
    ON user_progress FOR SELECT
    USING (user_id IN (SELECT id FROM user_profiles WHERE auth_uid = auth.uid()));

-- Tracks and lessons are publicly readable
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tracks are publicly readable"
    ON tracks FOR SELECT
    USING (TRUE);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons are publicly readable"
    ON lessons FOR SELECT
    USING (TRUE);

ALTER TABLE lesson_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lesson blocks are publicly readable"
    ON lesson_blocks FOR SELECT
    USING (TRUE);
-- ============================================================
-- 10. PORTFOLIO
-- ============================================================
CREATE TABLE user_portfolios (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL UNIQUE,  -- references user_profiles.id
    cash            FLOAT NOT NULL DEFAULT 100000.0,
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_portfolio_user FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
);

CREATE TABLE portfolio_holdings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id    UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
    symbol          TEXT NOT NULL,
    qty             INTEGER NOT NULL DEFAULT 0,
    avg_price       FLOAT NOT NULL DEFAULT 0.0,
    
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_portfolio_symbol UNIQUE (portfolio_id, symbol)
);

CREATE TABLE portfolio_shorts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id    UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
    symbol          TEXT NOT NULL,
    qty             INTEGER NOT NULL DEFAULT 0,
    entry_price     FLOAT NOT NULL DEFAULT 0.0,
    margin_held     FLOAT NOT NULL DEFAULT 0.0,
    
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_portfolio_short_symbol UNIQUE (portfolio_id, symbol)
);

CREATE TABLE portfolio_trades (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    portfolio_id    UUID NOT NULL REFERENCES user_portfolios(id) ON DELETE CASCADE,
    symbol          TEXT NOT NULL,
    type            TEXT NOT NULL,  -- 'BUY', 'SELL', 'SHORT', 'COVER'
    qty             INTEGER NOT NULL,
    price           FLOAT NOT NULL,
    total           FLOAT NOT NULL,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Apply updated_at triggers
CREATE TRIGGER trg_user_portfolios_updated_at
    BEFORE UPDATE ON user_portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_portfolio_holdings_updated_at
    BEFORE UPDATE ON portfolio_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_portfolio_shorts_updated_at
    BEFORE UPDATE ON portfolio_shorts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_shorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_trades ENABLE ROW LEVEL SECURITY;
