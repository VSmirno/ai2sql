/*
  # Fix superuser creation

  1. Security
    - Temporarily disable RLS to insert auth user
    - Re-enable RLS after insertion
  
  2. User Creation
    - Create superuser in auth.users with proper password hash
    - Create corresponding record in public.users table
    - Set email as confirmed
*/

-- Temporarily disable RLS for auth operations
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Delete existing superuser if exists
DELETE FROM auth.users WHERE email = 'admin@ai.ru';
DELETE FROM public.users WHERE email = 'admin@ai.ru';

-- Create superuser in auth.users table
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@ai.ru',
  crypt('asdfasdf', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  ''
);

-- Get the created user ID
DO $$
DECLARE
  user_id uuid;
BEGIN
  SELECT id INTO user_id FROM auth.users WHERE email = 'admin@ai.ru';
  
  -- Create corresponding record in public.users
  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    created_at,
    updated_at
  ) VALUES (
    user_id,
    'admin@ai.ru',
    'Администратор',
    'superuser',
    now(),
    now()
  );
END $$;

-- Re-enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;