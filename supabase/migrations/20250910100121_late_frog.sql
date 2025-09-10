/*
  # Полная очистка зависимостей таблицы users

  1. Удаление всех триггеров и функций связанных с auth.users
  2. Удаление всех ограничений и политик
  3. Очистка всех оставшихся ссылок на public.users
  4. Обеспечение чистой работы auth.users без дополнительных таблиц
*/

-- Удаляем все возможные триггеры на auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_user_profile ON auth.users;

-- Удаляем все функции связанные с пользователями
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Удаляем таблицу users если она еще существует
DROP TABLE IF EXISTS public.users CASCADE;

-- Убеждаемся что все внешние ключи ссылаются на auth.users
DO $$
BEGIN
  -- Обновляем projects.created_by если нужно
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'projects_created_by_fkey' 
    AND table_name = 'projects'
  ) THEN
    ALTER TABLE projects DROP CONSTRAINT projects_created_by_fkey;
    ALTER TABLE projects ADD CONSTRAINT projects_created_by_fkey 
      FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Обновляем project_members.user_id если нужно
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'project_members_user_id_fkey' 
    AND table_name = 'project_members'
  ) THEN
    ALTER TABLE project_members DROP CONSTRAINT project_members_user_id_fkey;
    ALTER TABLE project_members ADD CONSTRAINT project_members_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Обновляем project_members.added_by если нужно
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'project_members_added_by_fkey' 
    AND table_name = 'project_members'
  ) THEN
    ALTER TABLE project_members DROP CONSTRAINT project_members_added_by_fkey;
    ALTER TABLE project_members ADD CONSTRAINT project_members_added_by_fkey 
      FOREIGN KEY (added_by) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Обновляем chats.user_id если нужно
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'chats_user_id_fkey' 
    AND table_name = 'chats'
  ) THEN
    ALTER TABLE chats DROP CONSTRAINT chats_user_id_fkey;
    ALTER TABLE chats ADD CONSTRAINT chats_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Обновляем user_notes.user_id если нужно
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_notes_user_id_fkey' 
    AND table_name = 'user_notes'
  ) THEN
    ALTER TABLE user_notes DROP CONSTRAINT user_notes_user_id_fkey;
    ALTER TABLE user_notes ADD CONSTRAINT user_notes_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Обновляем sql_examples.user_id если нужно
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'sql_examples_user_id_fkey' 
    AND table_name = 'sql_examples'
  ) THEN
    ALTER TABLE sql_examples DROP CONSTRAINT sql_examples_user_id_fkey;
    ALTER TABLE sql_examples ADD CONSTRAINT sql_examples_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Обновляем app_settings.user_id если нужно
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

-- Создаем функцию для определения роли пользователя
CREATE OR REPLACE FUNCTION get_user_role(user_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF user_email = 'admin@example.com' THEN
    RETURN 'superuser';
  ELSE
    RETURN 'user';
  END IF;
END;
$$;

-- Убеждаемся что нет никаких политик RLS ссылающихся на public.users
-- Все политики должны использовать auth.uid() напрямую