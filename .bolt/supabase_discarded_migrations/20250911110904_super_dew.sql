/*
  # Fix RLS policies for database_connections table

  1. Security Changes
    - Drop existing policies that may have incorrect logic
    - Create new policies with proper authentication checks
    - Allow project owners to manage their database connections
    - Allow project members to read connections

  2. Policy Details
    - INSERT: Project owners can create connections for their projects
    - SELECT: Project members and owners can read connections
    - UPDATE: Project owners can update their connections
    - DELETE: Project owners can delete their connections
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Project members can read connections" ON database_connections;
DROP POLICY IF EXISTS "Project owners can create connections" ON database_connections;
DROP POLICY IF EXISTS "Project owners can update connections" ON database_connections;
DROP POLICY IF EXISTS "Project owners can delete connections" ON database_connections;

-- Create new INSERT policy for project owners
CREATE POLICY "Project owners can create connections"
  ON database_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = database_connections.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Create new SELECT policy for project members and owners
CREATE POLICY "Project members can read connections"
  ON database_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = database_connections.project_id
      AND (
        p.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM project_members pm
          WHERE pm.project_id = p.id
          AND pm.user_id = auth.uid()
        )
      )
    )
  );

-- Create new UPDATE policy for project owners
CREATE POLICY "Project owners can update connections"
  ON database_connections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = database_connections.project_id
      AND p.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = database_connections.project_id
      AND p.created_by = auth.uid()
    )
  );

-- Create new DELETE policy for project owners
CREATE POLICY "Project owners can delete connections"
  ON database_connections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = database_connections.project_id
      AND p.created_by = auth.uid()
    )
  );