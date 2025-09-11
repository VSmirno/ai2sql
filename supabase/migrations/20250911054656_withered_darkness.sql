/*
  # Add safe superuser policy for reading all users

  1. Security
    - Add policy for superusers to read all users
    - Use auth.jwt() to avoid recursion with users table
    - Check role claim directly from JWT token

  2. Changes
    - Create policy that checks role from JWT claims
    - Avoid querying users table within users table policy
*/

-- Add policy for superusers to read all users using JWT claims
CREATE POLICY "Superusers can read all users via JWT"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'superuser'
    OR 
    auth.jwt() ->> 'email' IN ('admin@ai.ru', 'admin@example.com')
  );