/*
  # Reset users RLS policies to fix infinite recursion

  1. Security Changes
    - Drop all existing RLS policies on users table
    - Create simple, non-recursive policies
    - Ensure no policy references the users table within its own condition

  2. New Policies
    - Users can read their own data (auth.uid() = id)
    - Users can update their own data (auth.uid() = id)
    - Service role has full access for admin operations
*/

-- Drop all existing policies on users table to start fresh
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Superusers can read all users" ON users;
DROP POLICY IF EXISTS "Service role can manage users" ON users;

-- Create simple, non-recursive policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable insert for authenticated users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Service role has full access (no recursion risk)
CREATE POLICY "Service role can manage users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);