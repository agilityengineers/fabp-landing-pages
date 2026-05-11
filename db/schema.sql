-- Failed submissions table
-- Stores every failed Brilliant Directories member creation attempt so
-- admins can review and retry them later.
CREATE TABLE IF NOT EXISTS failed_submissions (
  id            SERIAL        PRIMARY KEY,
  name          VARCHAR(255)  NOT NULL,
  last_name     VARCHAR(255)  NOT NULL,
  company       VARCHAR(255)  NOT NULL,
  state         VARCHAR(255)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  phone         VARCHAR(255),
  profession    VARCHAR(255)  NOT NULL,
  city          VARCHAR(255)  NOT NULL,
  years         VARCHAR(255),
  website       VARCHAR(255),
  spend         VARCHAR(255),
  fit           TEXT,
  industry_slug VARCHAR(255)  NOT NULL,
  submitted_at  TIMESTAMPTZ   NOT NULL,
  error_detail  TEXT          NOT NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  status        VARCHAR(50)   NOT NULL DEFAULT 'pending',
  resolved_at   TIMESTAMPTZ,
  retry_count   INTEGER       NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS failed_submissions_status_idx
  ON failed_submissions (status);

CREATE INDEX IF NOT EXISTS failed_submissions_email_idx
  ON failed_submissions (email);

-- Playbook lead-capture table
-- Stores every submission of the gated Provider Playbook download form.
CREATE TABLE IF NOT EXISTS playbook_leads (
  id            SERIAL        PRIMARY KEY,
  first_name    VARCHAR(255)  NOT NULL,
  last_name     VARCHAR(255)  NOT NULL,
  email         VARCHAR(255)  NOT NULL,
  phone         VARCHAR(50)   NOT NULL,
  consent       BOOLEAN       NOT NULL,
  industry_slug VARCHAR(255)  NOT NULL,
  user_agent    TEXT,
  ip_address    VARCHAR(64),
  submitted_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  slack_status  VARCHAR(20)   NOT NULL DEFAULT 'pending'
);

CREATE INDEX IF NOT EXISTS playbook_leads_industry_idx
  ON playbook_leads (industry_slug);

CREATE INDEX IF NOT EXISTS playbook_leads_submitted_idx
  ON playbook_leads (submitted_at DESC);

CREATE INDEX IF NOT EXISTS playbook_leads_email_idx
  ON playbook_leads (email);

-- Leads-management extension columns on playbook_leads.
-- Added in the leads-management-system migration; safe to run repeatedly.
ALTER TABLE playbook_leads
  ADD COLUMN IF NOT EXISTS status               VARCHAR(50)  NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS assigned_to          VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bvi_external_id      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bvi_sync_status      VARCHAR(20)  NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS bvi_synced_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bvi_last_error       TEXT,
  ADD COLUMN IF NOT EXISTS bvi_idempotency_key  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS bvi_attempts         INTEGER      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS playbook_leads_bvi_idem_idx
  ON playbook_leads (bvi_idempotency_key)
  WHERE bvi_idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS playbook_leads_status_idx
  ON playbook_leads (status);

CREATE INDEX IF NOT EXISTS playbook_leads_bvi_status_idx
  ON playbook_leads (bvi_sync_status);

-- Invitation-lead table.
-- Stores every Apply form submission so admins and sales reps can manage the
-- 3-step pipeline (apply -> brand_voice_interview -> listed) regardless of
-- whether the downstream Brilliant Directories user_create call succeeded.
CREATE TABLE IF NOT EXISTS invitation_leads (
  id                       SERIAL        PRIMARY KEY,
  first_name               VARCHAR(255)  NOT NULL,
  last_name                VARCHAR(255)  NOT NULL,
  email                    VARCHAR(255)  NOT NULL,
  phone                    VARCHAR(50),
  company                  VARCHAR(255),
  profession               VARCHAR(255),
  city                     VARCHAR(255),
  state                    VARCHAR(255),
  years                    VARCHAR(50),
  website                  VARCHAR(255),
  spend                    VARCHAR(50),
  fit                      TEXT,
  industry_slug            VARCHAR(255)  NOT NULL,
  variant                  VARCHAR(50),
  user_agent               TEXT,
  ip_address               VARCHAR(64),
  submitted_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

  -- Pipeline / management
  status                   VARCHAR(50)   NOT NULL DEFAULT 'new',
  invitation_step          VARCHAR(50)   NOT NULL DEFAULT 'apply',
  interview_scheduled_at   TIMESTAMPTZ,
  listing_published_at     TIMESTAMPTZ,
  assigned_to              VARCHAR(255),

  -- Brilliant Directories outcome (mirrors what we know about the BD member)
  bd_status                VARCHAR(20)   NOT NULL DEFAULT 'pending',
  bd_error                 TEXT,
  bd_user_id               VARCHAR(255),
  failed_submission_id     INTEGER,

  -- Brand Voice Interview push state
  bvi_external_id          VARCHAR(255),
  bvi_sync_status          VARCHAR(20)   NOT NULL DEFAULT 'pending',
  bvi_synced_at            TIMESTAMPTZ,
  bvi_last_error           TEXT,
  bvi_idempotency_key      VARCHAR(255),
  bvi_attempts             INTEGER       NOT NULL DEFAULT 0,

  deleted_at               TIMESTAMPTZ,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invitation_leads_industry_idx
  ON invitation_leads (industry_slug);

CREATE INDEX IF NOT EXISTS invitation_leads_submitted_idx
  ON invitation_leads (submitted_at DESC);

CREATE INDEX IF NOT EXISTS invitation_leads_email_idx
  ON invitation_leads (email);

CREATE INDEX IF NOT EXISTS invitation_leads_status_idx
  ON invitation_leads (status);

CREATE INDEX IF NOT EXISTS invitation_leads_step_idx
  ON invitation_leads (invitation_step);

CREATE INDEX IF NOT EXISTS invitation_leads_bvi_status_idx
  ON invitation_leads (bvi_sync_status);

CREATE UNIQUE INDEX IF NOT EXISTS invitation_leads_bvi_idem_idx
  ON invitation_leads (bvi_idempotency_key)
  WHERE bvi_idempotency_key IS NOT NULL;

-- Polymorphic notes / activity / sync log.
-- lead_type is a string discriminator ('playbook' | 'invitation') and lead_id
-- references the row in the corresponding table. We deliberately avoid foreign
-- keys here so a single child table can serve both lead types.
CREATE TABLE IF NOT EXISTS lead_notes (
  id          SERIAL        PRIMARY KEY,
  lead_type   VARCHAR(20)   NOT NULL,
  lead_id     INTEGER       NOT NULL,
  author      VARCHAR(255)  NOT NULL DEFAULT 'admin',
  body        TEXT          NOT NULL,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT lead_notes_type_chk CHECK (lead_type IN ('playbook','invitation'))
);

CREATE INDEX IF NOT EXISTS lead_notes_lead_idx
  ON lead_notes (lead_type, lead_id, created_at DESC);

CREATE TABLE IF NOT EXISTS lead_events (
  id          SERIAL        PRIMARY KEY,
  lead_type   VARCHAR(20)   NOT NULL,
  lead_id     INTEGER       NOT NULL,
  event_type  VARCHAR(50)   NOT NULL,
  actor       VARCHAR(255),
  payload     JSONB,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT lead_events_type_chk CHECK (lead_type IN ('playbook','invitation'))
);

CREATE INDEX IF NOT EXISTS lead_events_lead_idx
  ON lead_events (lead_type, lead_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bvi_sync_log (
  id              SERIAL        PRIMARY KEY,
  lead_type       VARCHAR(20)   NOT NULL,
  lead_id         INTEGER       NOT NULL,
  attempt         INTEGER       NOT NULL,
  request_body    JSONB,
  response_status INTEGER,
  response_body   TEXT,
  error           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  CONSTRAINT bvi_sync_log_type_chk CHECK (lead_type IN ('playbook','invitation'))
);

CREATE INDEX IF NOT EXISTS bvi_sync_log_lead_idx
  ON bvi_sync_log (lead_type, lead_id, created_at DESC);

-- Playbook generation jobs
-- Tracks each Anthropic-driven generation run for a per-industry playbook,
-- including the resulting draft S3 key and (after admin review) the
-- published key.
CREATE TABLE IF NOT EXISTS playbook_jobs (
  id               SERIAL        PRIMARY KEY,
  industry_slug    VARCHAR(255)  NOT NULL,
  status           VARCHAR(20)   NOT NULL DEFAULT 'running',
  draft_s3_key     VARCHAR(500),
  published_s3_key VARCHAR(500),
  notes            TEXT,
  error_message    TEXT,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS playbook_jobs_industry_idx
  ON playbook_jobs (industry_slug, created_at DESC);

CREATE INDEX IF NOT EXISTS playbook_jobs_status_idx
  ON playbook_jobs (status);
