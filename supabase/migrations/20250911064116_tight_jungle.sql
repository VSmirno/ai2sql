/*
  # Fix project access policy for regular users

  1. Policy Changes
    - Drop the restrictive "Allow users to read own projects" policy
    - Create a new policy that allows users to see projects they created OR are members of
    - This will fix the issue where regular users see "0 доступно" in project selector

  2. Security
    - Users can only see projects they have legitimate access to
    - Superusers maintain full access to all projects
    - No changes to write permissions - users can still only manage their own projects
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Allow users to read own projects" ON public.projects;

-- Create a new policy that allows users to see projects they created OR are members of
CREATE POLICY "Users can read accessible projects"
  ON public.projects
  FOR SELECT
  TO authenticated
  USING (
    -- User created the project
    created_by = auth.uid()
    OR
    -- User is a member of the project
    EXISTS (
      SELECT 1 
      FROM public.project_members 
      WHERE project_members.project_id = projects.id 
      AND project_members.user_id = auth.uid()
    )
  );