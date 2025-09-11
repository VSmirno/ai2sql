/*
  # Fix infinite recursion in project_members RLS policies

  1. Security
    - Drop existing problematic policies that cause infinite recursion
    - Add new policies that don't reference project_members table in their conditions
    - Use direct project ownership checks and superuser role checks
    - Avoid circular dependencies in policy evaluation

  2. Changes
    - Remove policies that query project_members table within their own conditions
    - Use simpler, non-recursive policy conditions
    - Maintain proper access control without circular references
*/

-- Drop existing policies that cause infinite recursion
DROP POLICY IF EXISTS "Project admins can manage project members" ON project_members;
DROP POLICY IF EXISTS "Superusers can manage all project members" ON project_members;
DROP POLICY IF EXISTS "Users can read accessible project members" ON project_members;

-- Create new policies without recursion
CREATE POLICY "Superusers can manage all project members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superuser'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'superuser'
    )
  );

-- Project owners can manage members of their projects
CREATE POLICY "Project owners can manage project members"
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

-- Users can read project members for projects they own
CREATE POLICY "Users can read project members for owned projects"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = project_members.project_id 
      AND projects.created_by = auth.uid()
    )
  );