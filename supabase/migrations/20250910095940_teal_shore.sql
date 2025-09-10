/*
  # Fix registration error

  1. Changes
    - Remove any triggers that try to insert into deleted users table
    - Clean up any remaining references to custom users table
    - Ensure auth.users works properly for registration

  This fixes the "Database error saving new user" error during registration.
*/

-- Drop any triggers that might be trying to insert into users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Make sure we don't have any remaining references to users table
-- Update foreign keys to reference auth.users directly
DO $$
BEGIN
  -- Update projects table if it still references old users table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_created_by_fkey' 
    AND table_name = 'projects'
  ) THEN
    ALTER TABLE projects DROP CONSTRAINT projects_created_by_fkey;
    ALTER TABLE projects ADD CONSTRAINT projects_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Update project_members table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'project_members_user_id_fkey' 
    AND table_name = 'project_members'
  ) THEN
    ALTER TABLE project_members DROP CONSTRAINT project_members_user_id_fkey;
    ALTER TABLE project_members ADD CONSTRAINT project_members_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'project_members_added_by_fkey' 
    AND table_name = 'project_members'
  ) THEN
    ALTER TABLE project_members DROP CONSTRAINT project_members_added_by_fkey;
    ALTER TABLE project_members ADD CONSTRAINT project_members_added_by_fkey 
      FOREIGN KEY (added_by) REFERENCES auth.users(id);
  END IF;

  -- Update chats table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chats_user_id_fkey' 
    AND table_name = 'chats'
  ) THEN
    ALTER TABLE chats DROP CONSTRAINT chats_user_id_fkey;
    ALTER TABLE chats ADD CONSTRAINT chats_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Update user_notes table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_notes_user_id_fkey' 
    AND table_name = 'user_notes'
  ) THEN
    ALTER TABLE user_notes DROP CONSTRAINT user_notes_user_id_fkey;
    ALTER TABLE user_notes ADD CONSTRAINT user_notes_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Update sql_examples table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sql_examples_user_id_fkey' 
    AND table_name = 'sql_examples'
  ) THEN
    ALTER TABLE sql_examples DROP CONSTRAINT sql_examples_user_id_fkey;
    ALTER TABLE sql_examples ADD CONSTRAINT sql_examples_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Update app_settings table
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'app_settings_user_id_fkey' 
    AND table_name = 'app_settings'
  ) THEN
    ALTER TABLE app_settings DROP CONSTRAINT app_settings_user_id_fkey;
    ALTER TABLE app_settings ADD CONSTRAINT app_settings_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;