/*
  # Fix RLS policy for messages table

  1. Security Changes
    - Drop existing restrictive INSERT policy for messages
    - Create new INSERT policy that allows users to create messages in chats they have access to
    - Ensure the policy correctly checks chat ownership through proper JOIN logic

  2. Policy Logic
    - Users can insert messages into chats that belong to them
    - Uses auth.uid() for better compatibility
    - Simplified JOIN condition for better performance
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create messages in own chats" ON messages;

-- Create new INSERT policy that allows users to create messages in their own chats
CREATE POLICY "Users can create messages in accessible chats"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM chats c 
      WHERE c.id = messages.chat_id 
      AND c.user_id = auth.uid()
    )
  );