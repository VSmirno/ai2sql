/*
  # Fix projects RLS policy for connection_id updates

  1. Security
    - Drop and recreate the projects RLS policy to ensure connection_id updates work
    - Allow project owners and members to update projects including connection_id field
    - Ensure proper permissions for all project operations
*/

-- Drop existing policies for projects table
DROP POLICY IF EXISTS "Allow users to manage own projects" ON projects;
DROP POLICY IF EXISTS "Allow superusers to manage all projects" ON projects;
DROP POLICY IF EXISTS "Allow superusers to read all projects" ON projects;
DROP POLICY IF EXISTS "Users can read accessible projects" ON projects;

-- Recreate comprehensive policies for projects table
CREATE POLICY "Project owners can manage their projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Project members can read and update projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = projects.id 
      AND pm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM project_members pm 
      WHERE pm.project_id = projects.id 
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Superusers can manage all projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') = ANY (ARRAY['admin@ai.ru', 'admin@example.com'])
  )
  WITH CHECK (
    (auth.jwt() ->> 'email') = ANY (ARRAY['admin@ai.ru', 'admin@example.com'])
  );