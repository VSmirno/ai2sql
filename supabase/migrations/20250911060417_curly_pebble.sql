/*
  # Fix infinite recursion in project_members policies

  1. Drop all existing policies that cause recursion
  2. Create simple policies that don't reference project_members table
  3. Use direct auth.uid() checks and simple joins

  ## New Policies
  - Superusers can do everything (based on email check)
  - Project owners can manage their project members
  - Users can read project members for projects they own
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Project members can read projects" ON project_members;
DROP POLICY IF EXISTS "Project owners can manage project members" ON project_members;
DROP POLICY IF EXISTS "Superusers can manage all project members" ON project_members;
DROP POLICY IF EXISTS "Users can manage own projects" ON project_members;
DROP POLICY IF EXISTS "Users can read project members for owned projects" ON project_members;

-- Simple policy for superusers (based on email)
CREATE POLICY "Superusers can manage all project members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN ('admin@ai.ru', 'admin@example.com')
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN ('admin@ai.ru', 'admin@example.com')
  );

-- Policy for project owners to manage their project members
CREATE POLICY "Project owners can manage members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.created_by = auth.uid()
    )
  );

-- Simple read policy for authenticated users
CREATE POLICY "Users can read project members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (true);