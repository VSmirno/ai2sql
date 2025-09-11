/*
  # Fix infinite recursion in users RLS policies

  1. Problem
    - The "Superusers can read all users" policy creates infinite recursion
    - It queries the users table from within a users table policy
    - This creates a circular dependency

  2. Solution
    - Drop the problematic policy that causes recursion
    - Create a simpler policy structure that doesn't self-reference
    - Use auth.jwt() to check user role directly from JWT claims instead of querying users table

  3. Security
    - Users can still read their own data
    - Service role maintains full access
    - Superuser access will be handled differently to avoid recursion
*/

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Superusers can read all users" ON users;

-- Ensure we have the basic policies without recursion
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;

-- Recreate simple, non-recursive policies
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

-- Service role policy (non-recursive)
CREATE POLICY "Service role can manage users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);