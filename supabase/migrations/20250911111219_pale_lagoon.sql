/*
  # Allow all project members to manage database connections

  1. Security Changes
    - Allow all project members (not just owners) to create, read, update, and delete database connections
    - Check membership through project_members table or project ownership
    - Maintain security by ensuring users can only access connections for projects they belong to

  2. Updated Policies
    - INSERT: Project members and owners can create connections
    - SELECT: Project members and owners can read connections  
    - UPDATE: Project members and owners can update connections
    - DELETE: Project members and owners can delete connections
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Project owners can create connections" ON database_connections;
DROP POLICY IF EXISTS "Project members can read connections" ON database_connections;
DROP POLICY IF EXISTS "Project owners can update connections" ON database_connections;
DROP POLICY IF EXISTS "Project owners can delete connections" ON database_connections;

-- Create new policies that allow all project members to manage connections

-- Allow project members and owners to create connections
CREATE POLICY "Project members can create connections"
  ON database_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = database_connections.project_id 
      AND p.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN projects p ON p.id = pm.project_id
      WHERE p.id = database_connections.project_id 
      AND pm.user_id = auth.uid()
    )
  );

-- Allow project members and owners to read connections
CREATE POLICY "Project members can read connections"
  ON database_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = database_connections.project_id 
      AND p.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN projects p ON p.id = pm.project_id
      WHERE p.id = database_connections.project_id 
      AND pm.user_id = auth.uid()
    )
  );

-- Allow project members and owners to update connections
CREATE POLICY "Project members can update connections"
  ON database_connections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = database_connections.project_id 
      AND p.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN projects p ON p.id = pm.project_id
      WHERE p.id = database_connections.project_id 
      AND pm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = database_connections.project_id 
      AND p.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN projects p ON p.id = pm.project_id
      WHERE p.id = database_connections.project_id 
      AND pm.user_id = auth.uid()
    )
  );

-- Allow project members and owners to delete connections
CREATE POLICY "Project members can delete connections"
  ON database_connections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = database_connections.project_id 
      AND p.created_by = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM project_members pm
      JOIN projects p ON p.id = pm.project_id
      WHERE p.id = database_connections.project_id 
      AND pm.user_id = auth.uid()
    )
  );