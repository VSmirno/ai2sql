/*
  # Создать таблицу пользователей правильно

  1. Новые таблицы
    - `users` - таблица пользователей с правильными полями
  2. Безопасность
    - Включить RLS
    - Добавить политики для пользователей
  3. Триггер
    - Автоматическое создание записи при регистрации
*/

-- Создаем таблицу пользователей
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superuser')),
  last_project_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Включаем RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Политики
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Функция для создания пользователя
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  user_role text := 'user';
BEGIN
  -- Определяем роль по email
  IF NEW.email = 'admin@example.com' THEN
    user_role := 'superuser';
  ELSIF NEW.email LIKE '%@admin.com' THEN
    user_role := 'admin';
  END IF;

  -- Создаем запись пользователя
  INSERT INTO users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    user_role
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Триггер на создание пользователя
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Создаем суперадмина если его нет
DO $$
BEGIN
  -- Проверяем есть ли уже admin@example.com в auth.users
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'admin@example.com'
  ) THEN
    -- Если нет в auth.users, создаем только в users таблице
    INSERT INTO users (id, email, name, role)
    VALUES (
      gen_random_uuid(),
      'admin@example.com',
      'Суперадмин',
      'superuser'
    )
    ON CONFLICT (email) DO NOTHING;
  ELSE
    -- Если есть в auth.users, создаем/обновляем в users
    INSERT INTO users (id, email, name, role)
    SELECT id, email, COALESCE(raw_user_meta_data->>'name', 'Суперадмин'), 'superuser'
    FROM auth.users 
    WHERE email = 'admin@example.com'
    ON CONFLICT (email) DO UPDATE SET
      role = 'superuser',
      name = COALESCE(EXCLUDED.name, users.name);
  END IF;
END $$;