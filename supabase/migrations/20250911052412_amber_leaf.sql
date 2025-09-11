/*
  # Add policy for superusers to read all users

  1. Security Changes
    - Add policy allowing superusers to read all users from the users table
    - This enables the admin page functionality for user management

  2. Policy Details
    - Policy name: "Superusers can read all users"
    - Applies to: SELECT operations on users table
    - Role: authenticated users
    - Condition: Current user must have 'superuser' role
*/

-- Add policy for superusers to read all users
CREATE POLICY "Superusers can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'superuser'
    )
  );