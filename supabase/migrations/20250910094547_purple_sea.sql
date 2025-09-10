/*
  # Fix users table defaults

  1. Schema Updates
    - Ensure created_at and updated_at have proper defaults
    - Make sure all columns have appropriate constraints
    - Fix any potential issues with user creation

  2. Security
    - Maintain existing RLS policies
    - Ensure proper constraints are in place
*/

-- Ensure the users table has proper defaults and constraints
ALTER TABLE public.users 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Make sure created_at and updated_at are NOT NULL
ALTER TABLE public.users 
  ALTER COLUMN created_at SET NOT NULL,
  ALTER COLUMN updated_at SET NOT NULL;

-- Add a trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if it exists and recreate it
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();