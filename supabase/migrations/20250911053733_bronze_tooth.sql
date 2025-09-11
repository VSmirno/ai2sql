/*
  # Fix infinite recursion in RLS policies

  1. Policy Changes
    - Remove complex subqueries from projects policies that reference users table
    - Simplify policies to avoid circular dependencies
    - Keep user access control simple and direct

  2. Security
    - Maintain proper access control without circular references
    - Use direct user ID comparisons instead of complex subqueries
*/

-- Drop existing problematic policies on projects table
DROP POLICY IF EXISTS "Project creators can manage projects" ON projects;
DROP POLICY IF EXISTS "Superusers can create projects" ON projects;
DROP POLICY IF EXISTS "Users can read accessible projects" ON projects;

-- Create simplified policies that don't create circular dependencies
CREATE POLICY "Users can manage own projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Project members can read projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()
    )
  );

-- Ensure users table has simple, non-recursive policies
DROP POLICY IF EXISTS "Service role can manage users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create simple, direct policies for users table
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

-- Service role policy (no recursion risk)
CREATE POLICY "Service role can manage users"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);