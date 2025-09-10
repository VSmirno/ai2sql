/*
  # Исправление аутентификации - удаление кастомных пользователей

  1. Удаляем кастомную таблицу users
  2. Обновляем все внешние ключи для использования auth.users
  3. Создаем функцию для получения текущего пользователя
  4. Обновляем RLS политики
*/

-- Удаляем кастомную таблицу users
DROP TABLE IF EXISTS users CASCADE;

-- Создаем функцию для получения текущего пользователя из auth.users
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim.sub', true), ''),
        (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
$$;

-- Создаем функцию для получения роли пользователя
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid DEFAULT auth.uid())
RETURNS text AS $$
BEGIN
  -- Проверяем, является ли пользователь суперадмином по email
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id AND email = 'admin@example.com'
  ) THEN
    RETURN 'superuser';
  END IF;
  
  -- Проверяем роль администратора проекта
  IF EXISTS (
    SELECT 1 FROM project_members 
    WHERE user_id = get_user_role.user_id AND role = 'admin'
  ) THEN
    RETURN 'admin';
  END IF;
  
  RETURN 'user';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Обновляем таблицу projects - убираем ссылку на users
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_created_by_fkey;
ALTER TABLE projects ALTER COLUMN created_by TYPE uuid USING created_by::uuid;

-- Обновляем таблицу project_members - убираем ссылки на users
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_user_id_fkey;
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_added_by_fkey;
ALTER TABLE project_members ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
ALTER TABLE project_members ALTER COLUMN added_by TYPE uuid USING added_by::uuid;

-- Обновляем таблицу chats - убираем ссылку на users
ALTER TABLE chats DROP CONSTRAINT IF EXISTS chats_user_id_fkey;
ALTER TABLE chats ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Обновляем таблицу user_notes - убираем ссылку на users
ALTER TABLE user_notes DROP CONSTRAINT IF EXISTS user_notes_user_id_fkey;
ALTER TABLE user_notes ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Обновляем таблицу sql_examples - убираем ссылку на users
ALTER TABLE sql_examples DROP CONSTRAINT IF EXISTS sql_examples_user_id_fkey;
ALTER TABLE sql_examples ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Обновляем таблицу app_settings - убираем ссылку на users
ALTER TABLE app_settings DROP CONSTRAINT IF EXISTS app_settings_user_id_fkey;
ALTER TABLE app_settings ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- Обновляем RLS политики для projects
DROP POLICY IF EXISTS "Project admins can update projects" ON projects;
DROP POLICY IF EXISTS "Superusers can create projects" ON projects;
DROP POLICY IF EXISTS "Users can read accessible projects" ON projects;

CREATE POLICY "Project admins can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id 
      AND pm.user_id = auth.uid() 
      AND pm.role = 'admin'
    ) OR get_user_role() = 'superuser'
  );

CREATE POLICY "Superusers can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = 'superuser');

CREATE POLICY "Users can read accessible projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id 
      AND pm.user_id = auth.uid()
    ) OR get_user_role() = 'superuser'
  );

-- Обновляем RLS политики для project_members
DROP POLICY IF EXISTS "Project admins can manage members" ON project_members;
DROP POLICY IF EXISTS "Users can read project members" ON project_members;

CREATE POLICY "Project admins can manage members"
  ON project_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid() 
      AND pm.role = 'admin'
    ) OR get_user_role() = 'superuser'
  );

CREATE POLICY "Users can read project members"
  ON project_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id 
      AND pm.user_id = auth.uid()
    ) OR get_user_role() = 'superuser'
  );

-- Обновляем RLS политики для chats
DROP POLICY IF EXISTS "Users can create chats in accessible projects" ON chats;
DROP POLICY IF EXISTS "Users can delete own chats" ON chats;
DROP POLICY IF EXISTS "Users can read own chats" ON chats;
DROP POLICY IF EXISTS "Users can update own chats" ON chats;

CREATE POLICY "Users can create chats in accessible projects"
  ON chats
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = chats.project_id 
      AND pm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own chats"
  ON chats
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read own chats"
  ON chats
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own chats"
  ON chats
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Обновляем RLS политики для messages
DROP POLICY IF EXISTS "Users can create messages in own chats" ON messages;
DROP POLICY IF EXISTS "Users can read messages from own chats" ON messages;

CREATE POLICY "Users can create messages in own chats"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id = messages.chat_id 
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read messages from own chats"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id = messages.chat_id 
      AND c.user_id = auth.uid()
    )
  );

-- Обновляем RLS политики для user_notes
DROP POLICY IF EXISTS "Users can manage own notes" ON user_notes;

CREATE POLICY "Users can manage own notes"
  ON user_notes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Обновляем RLS политики для sql_examples
DROP POLICY IF EXISTS "Users can manage own sql examples" ON sql_examples;

CREATE POLICY "Users can manage own sql examples"
  ON sql_examples
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Обновляем RLS политики для app_settings
DROP POLICY IF EXISTS "Users can manage own settings" ON app_settings;

CREATE POLICY "Users can manage own settings"
  ON app_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Создаем суперадмина в auth.users (если не существует)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@example.com') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@example.com',
      crypt('asdfasdf', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Admin User"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;

-- Создаем тестовые данные с правильными UUID из auth.users
DO $$
DECLARE
  admin_id uuid;
  project1_id uuid := gen_random_uuid();
  project2_id uuid := gen_random_uuid();
  project3_id uuid := gen_random_uuid();
  chat1_id uuid := gen_random_uuid();
  chat2_id uuid := gen_random_uuid();
  conn1_id uuid := gen_random_uuid();
  conn2_id uuid := gen_random_uuid();
  table1_id uuid := gen_random_uuid();
  table2_id uuid := gen_random_uuid();
BEGIN
  -- Получаем ID админа из auth.users
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@example.com' LIMIT 1;
  
  IF admin_id IS NOT NULL THEN
    -- Создаем проекты
    INSERT INTO projects (id, name, description, created_by, created_at, updated_at) VALUES
    (project1_id, 'E-commerce Platform', 'Основная платформа интернет-магазина с полным циклом заказов', admin_id, NOW(), NOW()),
    (project2_id, 'Analytics Dashboard', 'Система аналитики и отчетности для бизнеса', admin_id, NOW(), NOW()),
    (project3_id, 'CRM System', 'Система управления взаимоотношениями с клиентами', admin_id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Добавляем админа как участника всех проектов
    INSERT INTO project_members (project_id, user_id, role, added_by, added_at) VALUES
    (project1_id, admin_id, 'admin', admin_id, NOW()),
    (project2_id, admin_id, 'admin', admin_id, NOW()),
    (project3_id, admin_id, 'admin', admin_id, NOW())
    ON CONFLICT (project_id, user_id) DO NOTHING;

    -- Создаем подключения к БД
    INSERT INTO database_connections (id, project_id, name, host, port, username, password, database, created_at, updated_at) VALUES
    (conn1_id, project1_id, 'Production DB', 'prod-db.example.com', 5432, 'app_user', 'secure_password', 'ecommerce_prod', NOW(), NOW()),
    (conn2_id, project2_id, 'Analytics DB', 'analytics-db.example.com', 5432, 'analytics_user', 'analytics_pass', 'analytics_db', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Создаем чаты
    INSERT INTO chats (id, name, user_id, project_id, created_at, updated_at) VALUES
    (chat1_id, 'Анализ продаж', admin_id, project1_id, NOW(), NOW()),
    (chat2_id, 'Отчеты по клиентам', admin_id, project2_id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Создаем сообщения
    INSERT INTO messages (chat_id, role, content, sql_query, created_at) VALUES
    (chat1_id, 'user', 'Покажи топ-10 товаров по продажам за последний месяц', NULL, NOW()),
    (chat1_id, 'assistant', 'Вот SQL-запрос для получения топ-10 товаров по продажам:', 
     'SELECT p.name, SUM(oi.quantity * oi.price) as total_sales FROM products p JOIN order_items oi ON p.id = oi.product_id JOIN orders o ON oi.order_id = o.id WHERE o.created_at >= NOW() - INTERVAL ''1 month'' GROUP BY p.id, p.name ORDER BY total_sales DESC LIMIT 10;', 
     NOW()),
    (chat2_id, 'user', 'Найди всех клиентов, которые не делали заказы более 3 месяцев', NULL, NOW()),
    (chat2_id, 'assistant', 'Запрос для поиска неактивных клиентов:', 
     'SELECT u.id, u.name, u.email, MAX(o.created_at) as last_order FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name, u.email HAVING MAX(o.created_at) < NOW() - INTERVAL ''3 months'' OR MAX(o.created_at) IS NULL ORDER BY last_order DESC NULLS LAST;', 
     NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Создаем заметки
    INSERT INTO user_notes (title, content, user_id, project_id, created_at, updated_at) VALUES
    ('Бизнес-логика заказов', 'Заказ считается завершенным только после подтверждения оплаты и отправки товара. Статусы: pending, paid, shipped, delivered, cancelled.', admin_id, project1_id, NOW(), NOW()),
    ('Правила расчета скидок', 'Скидки применяются в следующем порядке: 1) Персональная скидка клиента 2) Скидка по промокоду 3) Сезонная скидка. Максимальная общая скидка - 50%.', admin_id, project1_id, NOW(), NOW()),
    ('KPI метрики', 'Основные метрики для отслеживания: CAC (стоимость привлечения клиента), LTV (пожизненная ценность), конверсия, средний чек, retention rate.', admin_id, project2_id, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Создаем SQL примеры
    INSERT INTO sql_examples (natural_language_query, sql_query, user_id, project_id, created_at) VALUES
    ('Найти всех активных пользователей', 'SELECT * FROM users WHERE status = ''active'' AND last_login > NOW() - INTERVAL ''30 days'';', admin_id, project1_id, NOW()),
    ('Посчитать общую выручку за месяц', 'SELECT SUM(total_amount) as monthly_revenue FROM orders WHERE created_at >= DATE_TRUNC(''month'', NOW()) AND status = ''completed'';', admin_id, project1_id, NOW()),
    ('Топ-5 категорий товаров по продажам', 'SELECT c.name, COUNT(oi.id) as sales_count FROM categories c JOIN products p ON c.id = p.category_id JOIN order_items oi ON p.id = oi.product_id GROUP BY c.id, c.name ORDER BY sales_count DESC LIMIT 5;', admin_id, project1_id, NOW()),
    ('Клиенты с наибольшим количеством заказов', 'SELECT u.name, u.email, COUNT(o.id) as order_count FROM users u JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name, u.email ORDER BY order_count DESC LIMIT 10;', admin_id, project2_id, NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Создаем метаданные таблиц
    INSERT INTO table_metadata (id, project_id, schema_name, table_name, description, created_at, updated_at) VALUES
    (table1_id, project1_id, 'public', 'users', 'Таблица пользователей системы', NOW(), NOW()),
    (table2_id, project1_id, 'public', 'orders', 'Таблица заказов клиентов', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;

    -- Создаем метаданные колонок
    INSERT INTO column_metadata (table_metadata_id, column_name, data_type, is_nullable, is_primary_key, is_foreign_key, description, created_at) VALUES
    (table1_id, 'id', 'uuid', false, true, false, 'Уникальный идентификатор пользователя', NOW()),
    (table1_id, 'email', 'varchar(255)', false, false, false, 'Email адрес пользователя', NOW()),
    (table1_id, 'name', 'varchar(255)', false, false, false, 'Полное имя пользователя', NOW()),
    (table1_id, 'status', 'varchar(50)', false, false, false, 'Статус пользователя (active, inactive, banned)', NOW()),
    (table1_id, 'created_at', 'timestamp', false, false, false, 'Дата регистрации', NOW()),
    (table2_id, 'id', 'uuid', false, true, false, 'Уникальный идентификатор заказа', NOW()),
    (table2_id, 'user_id', 'uuid', false, false, true, 'ID пользователя, сделавшего заказ', NOW()),
    (table2_id, 'total_amount', 'decimal(10,2)', false, false, false, 'Общая сумма заказа', NOW()),
    (table2_id, 'status', 'varchar(50)', false, false, false, 'Статус заказа', NOW()),
    (table2_id, 'created_at', 'timestamp', false, false, false, 'Дата создания заказа', NOW())
    ON CONFLICT (table_metadata_id, column_name) DO NOTHING;

    -- Создаем настройки приложения
    INSERT INTO app_settings (user_id, rag_examples_count, debug_mode, rag_similarity_threshold, created_at, updated_at) VALUES
    (admin_id, 5, true, 0.35, NOW(), NOW())
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;