/*
  # Fix infinite recursion in RLS policies

  1. Remove all problematic policies that cause circular dependencies
  2. Create simple, non-recursive policies for projects and project_members
  3. Use direct auth checks without cross-table references

  ## Changes
  - Drop all existing policies on projects and project_members tables
  - Create simple policies that avoid circular references
  - Allow superusers full access
  - Allow users to manage their own projects
  - Allow basic read access for authenticated users
*/

-- Drop all existing policies that cause recursion
DROP POLICY IF EXISTS "Project members can read projects" ON projects;
DROP POLICY IF EXISTS "Users can manage own projects" ON projects;
DROP POLICY IF EXISTS "Project owners can manage members" ON project_members;
DROP POLICY IF EXISTS "Superusers can manage all project members" ON project_members;
DROP POLICY IF EXISTS "Users can read project members" ON project_members;
DROP POLICY IF EXISTS "Allow superusers to manage project members" ON project_members;
DROP POLICY IF EXISTS "Allow project owners to manage members" ON project_members;
DROP POLICY IF EXISTS "Allow read access to project members" ON project_members;

-- Simple policies for projects table (no cross-table references)
CREATE POLICY "Allow users to read own projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Allow superusers to read all projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN ('admin@ai.ru', 'admin@example.com')
  );

CREATE POLICY "Allow users to manage own projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow superusers to manage all projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN ('admin@ai.ru', 'admin@example.com')
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') IN ('admin@ai.ru', 'admin@example.com')
  );

-- Simple policies for project_members table (no cross-table references)
CREATE POLICY "Allow users to read all project members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow superusers to manage all project members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN ('admin@ai.ru', 'admin@example.com')
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') IN ('admin@ai.ru', 'admin@example.com')
  );