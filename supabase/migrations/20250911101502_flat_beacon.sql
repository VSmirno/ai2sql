/*
  # Fix chat SELECT RLS policy

  1. Changes
    - Drop existing restrictive SELECT policy that only allows chat owners to read their own chats
    - Add new SELECT policy that allows all project members to read all chats within their projects

  2. Security
    - Maintains security by ensuring users can only read chats from projects they are members of
    - Enables proper collaboration by allowing all project members to see all project chats
*/

-- Drop the existing policy that restricts chat reads to only the owner
DROP POLICY IF EXISTS "Users can read own chats" ON public.chats;

-- Create a new policy that allows authenticated users to read chats
-- if they are a member of the project the chat belongs to
CREATE POLICY "Users can read project chats if they are members of the project"
ON public.chats
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.project_members pm
    WHERE pm.project_id = chats.project_id 
    AND pm.user_id = auth.uid()
  )
);