/*
  # Fix projects table RLS policies

  1. Security
    - Add policy for superusers to create projects
    - Add policy for project members to read projects
    - Add policy for project creators to manage their projects
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Superusers can create projects" ON projects;
DROP POLICY IF EXISTS "Users can read accessible projects" ON projects;
DROP POLICY IF EXISTS "Project creators can manage projects" ON projects;

-- Allow superusers to create projects
CREATE POLICY "Superusers can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superuser'
    )
  );

-- Allow users to read projects they have access to
CREATE POLICY "Users can read accessible projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    -- Superusers can see all projects
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superuser'
    )
    OR
    -- Project members can see their projects
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id 
      AND pm.user_id = auth.uid()
    )
    OR
    -- Project creators can see their projects
    projects.created_by = auth.uid()
  );

-- Allow project creators and superusers to update/delete projects
CREATE POLICY "Project creators can manage projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    -- Superusers can manage all projects
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superuser'
    )
    OR
    -- Project creators can manage their projects
    projects.created_by = auth.uid()
  )
  WITH CHECK (
    -- Same conditions for updates
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superuser'
    )
    OR
    projects.created_by = auth.uid()
  );