/*
  # Add RLS policies for project_members table

  1. Security
    - Add policy for superusers to manage all project members
    - Add policy for project admins to manage members in their projects
    - Add policy for all authenticated users to read project members they have access to

  2. Changes
    - CREATE POLICY for superusers to have full access
    - CREATE POLICY for project admins to manage members
    - CREATE POLICY for authenticated users to read accessible project members
*/

-- Policy for superusers to manage all project members
CREATE POLICY "Superusers can manage all project members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'superuser'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );

-- Policy for project admins to manage members in their projects
CREATE POLICY "Project admins can manage project members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id 
        AND pm.user_id = auth.uid() 
        AND pm.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id 
        AND pm.user_id = auth.uid() 
        AND pm.role = 'admin'
    )
  );

-- Policy for authenticated users to read project members they have access to
CREATE POLICY "Users can read accessible project members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    -- User can read members of projects they belong to
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id 
        AND pm.user_id = auth.uid()
    )
    OR
    -- Superusers can read all
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'superuser'
    )
  );