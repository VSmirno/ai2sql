/*
  # Allow all authenticated users to read and create messages

  1. Security Changes
    - Remove restrictive RLS policies for messages table
    - Allow all authenticated users to read messages
    - Allow all authenticated users to create messages
    
  2. Changes
    - Drop existing policies that restrict access to chat owners only
    - Create new permissive policies for authenticated users
*/

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create messages in own chats" ON messages;
DROP POLICY IF EXISTS "Users can read messages from own chats" ON messages;

-- Create new permissive policies for all authenticated users
CREATE POLICY "Authenticated users can read all messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);