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
