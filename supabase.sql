-- شغل هذا الكود في SQL Editor في Supabase Dashboard

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  password_hash text NOT NULL,
  verified boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  type text NOT NULL DEFAULT 'signup', -- 'signup' or 'login'
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);
