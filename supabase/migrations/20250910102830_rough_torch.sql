/*
  # Создание суперпользователя

  1. Создание пользователя в auth.users
  2. Создание записи в таблице users с ролью superuser
*/

-- Создаем суперпользователя в auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@ai.ru',
  crypt('asdfasdf', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Администратор"}',
  false,
  'authenticated'
) ON CONFLICT (email) DO NOTHING;

-- Создаем запись в таблице users (если триггер не сработал)
INSERT INTO users (
  id,
  email,
  name,
  role
) 
SELECT 
  au.id,
  au.email,
  'Администратор',
  'superuser'
FROM auth.users au 
WHERE au.email = 'admin@ai.ru'
ON CONFLICT (id) DO UPDATE SET
  role = 'superuser',
  name = 'Администратор';