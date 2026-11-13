-- FinWise schema. Money is numeric(16,2); dates are real DATE columns.

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text        NOT NULL,
  password_hash text        NOT NULL,
  name          text        NOT NULL DEFAULT '',
  currency      char(3)     NOT NULL DEFAULT 'USD',
  onboarded     boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));

CREATE TABLE profiles (
  user_id     uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  income      numeric(16,2) NOT NULL DEFAULT 0 CHECK (income >= 0),
  essentials  numeric(16,2) NOT NULL DEFAULT 0 CHECK (essentials >= 0),
  commitments numeric(16,2) NOT NULL DEFAULT 0 CHECK (commitments >= 0),
  savings     numeric(16,2) NOT NULL DEFAULT 0 CHECK (savings >= 0)
);

CREATE TABLE goals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  target     numeric(16,2) NOT NULL CHECK (target > 0),
  saved      numeric(16,2) NOT NULL DEFAULT 0 CHECK (saved >= 0),
  icon       text NOT NULL DEFAULT '◎',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX goals_user_idx ON goals (user_id, created_at);

CREATE TABLE transactions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type           text NOT NULL CHECK (type IN ('income', 'expense')),
  description    text NOT NULL DEFAULT '',
  category       text NOT NULL,
  amount         numeric(16,2) NOT NULL CHECK (amount > 0),
  date           date NOT NULL,
  recurring      boolean NOT NULL DEFAULT false,
  last_processed date,
  generated_from uuid REFERENCES transactions(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX transactions_user_date_idx ON transactions (user_id, date DESC);
-- A recurring entry can only ever produce one copy per month (makes catch-up idempotent).
CREATE UNIQUE INDEX transactions_generated_once ON transactions (generated_from, date) WHERE generated_from IS NOT NULL;

CREATE TABLE budgets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category     text NOT NULL,
  limit_amount numeric(16,2) NOT NULL CHECK (limit_amount > 0),
  UNIQUE (user_id, category)
);

CREATE TABLE subscriptions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  category   text NOT NULL,
  amount     numeric(16,2) NOT NULL CHECK (amount > 0),
  cycle      text NOT NULL CHECK (cycle IN ('monthly', 'yearly', 'weekly')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX subscriptions_user_idx ON subscriptions (user_id, created_at);

CREATE TABLE scenarios (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  monthly    numeric(16,2) NOT NULL DEFAULT 0 CHECK (monthly >= 0),
  one_time   numeric(16,2) NOT NULL DEFAULT 0 CHECK (one_time >= 0),
  duration   integer NOT NULL DEFAULT 12 CHECK (duration BETWEEN 1 AND 600),
  note       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX scenarios_user_idx ON scenarios (user_id, created_at);
