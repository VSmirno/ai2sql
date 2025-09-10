/*
  # Создание суперпользователя

  1. Создание пользователя в auth.users
    - Email: admin@ai.ru
    - Пароль: asdfasdf
    - Подтвержденный email
    - Роль: authenticated

  2. Создание записи в таблице users
    - Роль: superuser
    - Связь с auth.users через id
*/

-- Создаем пользователя в auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@ai.ru',
  crypt('asdfasdf', gen_salt('bf')),
  now(),
  now(),
  now(),
  'authenticated',
  'authenticated',
  '',
  '',
  ''
) ON CONFLICT (email) DO UPDATE SET
  encrypted_password = crypt('asdfasdf', gen_salt('bf')),
  updated_at = now();

-- Создаем запись в таблице users для суперпользователя
INSERT INTO users (
  id,
  email,
  name,
  role,
  created_at,
  updated_at
) 
SELECT 
  au.id,
  'admin@ai.ru',
  'Суперадминистратор',
  'superuser',
  now(),
  now()
FROM auth.users au 
WHERE au.email = 'admin@ai.ru'
ON CONFLICT (id) DO UPDATE SET
  role = 'superuser',
  name = 'Суперадминистратор',
  updated_at = now();