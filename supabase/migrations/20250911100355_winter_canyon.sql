/*
  # Fix chat creation RLS policy

  1. Security Updates
    - Drop existing INSERT policy for chats table
    - Create new INSERT policy that properly checks project membership
    - Ensure users can only create chats in projects they have access to

  2. Policy Logic
    - User must be authenticated
    - The user_id in the chat must match the authenticated user
    - The user must be a member of the project (checked via project_members table)
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can create chats in accessible projects" ON public.chats;

-- Create new INSERT policy with proper project membership check
CREATE POLICY "Users can create chats in accessible projects" 
ON public.chats 
FOR INSERT 
TO authenticated 
WITH CHECK (
  (auth.uid() = user_id) 
  AND 
  EXISTS (
    SELECT 1 
    FROM public.project_members pm 
    WHERE pm.project_id = chats.project_id 
    AND pm.user_id = auth.uid()
  )
);