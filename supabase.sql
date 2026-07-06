-- شغل هذا الكود في SQL Editor في Supabase Dashboard

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  password_hash text NOT NULL,
  verified boolean DEFAULT true,
  banned boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  type text NOT NULL DEFAULT 'signup',
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text DEFAULT 'fa-shield-halved',
  download_url text NOT NULL,
  video_url text DEFAULT '',
  tag1 text DEFAULT 'جديد',
  tag2 text DEFAULT 'v1.0',
  rating text DEFAULT '4.9',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS visits (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  ip text DEFAULT '',
  user_agent text DEFAULT '',
  created_at timestamptz DEFAULT now()
);
