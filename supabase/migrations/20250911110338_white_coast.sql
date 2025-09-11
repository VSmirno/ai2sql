/*
  # Fix RLS policy for database_connections table

  1. Policy Updates
    - Update INSERT policy to allow project owners to create connections
    - Ensure project owners can create connections for their projects

  2. Security
    - Maintain security by checking project ownership
    - Allow only project creators to add connections to their projects
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Project editors can manage connections" ON public.database_connections;

-- Create new INSERT policy that allows project owners to create connections
CREATE POLICY "Project owners can create connections"
  ON public.database_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.projects p 
      WHERE p.id = database_connections.project_id 
      AND p.created_by = auth.uid()
    )
  );

-- Ensure the existing SELECT policy allows project members to read connections
DROP POLICY IF EXISTS "Project members can read connections" ON public.database_connections;

CREATE POLICY "Project members can read connections"
  ON public.database_connections
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.project_members pm
      WHERE pm.project_id = database_connections.project_id 
      AND pm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 
      FROM public.projects p 
      WHERE p.id = database_connections.project_id 
      AND p.created_by = auth.uid()
    )
  );

-- Update UPDATE policy to allow project owners to update connections
DROP POLICY IF EXISTS "Project editors can manage connections" ON public.database_connections;

CREATE POLICY "Project owners can update connections"
  ON public.database_connections
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.projects p 
      WHERE p.id = database_connections.project_id 
      AND p.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM public.projects p 
      WHERE p.id = database_connections.project_id 
      AND p.created_by = auth.uid()
    )
  );

-- Create DELETE policy to allow project owners to delete connections
DROP POLICY IF EXISTS "Project owners can delete connections" ON public.database_connections;

CREATE POLICY "Project owners can delete connections"
  ON public.database_connections
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM public.projects p 
      WHERE p.id = database_connections.project_id 
      AND p.created_by = auth.uid()
    )
  );