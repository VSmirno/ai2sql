/*
  # Создание основной схемы AI2SQL

  1. Новые таблицы
    - `users` - пользователи системы
    - `projects` - проекты
    - `project_members` - участники проектов с ролями
    - `database_connections` - подключения к базам данных
    - `chats` - чаты пользователей
    - `messages` - сообщения в чатах
    - `user_notes` - заметки пользователей
    - `sql_examples` - примеры SQL запросов
    - `table_metadata` - метаданные таблиц
    - `column_metadata` - метаданные колонок
    - `app_settings` - настройки приложения

  2. Безопасность
    - Включен RLS для всех таблиц
    - Политики доступа на основе ролей пользователей
    - Изоляция данных по проектам

  3. Индексы и ограничения
    - Уникальные ограничения для критичных полей
    - Внешние ключи для связей между таблицами
    - Индексы для оптимизации запросов
*/

-- Создание enum типов
CREATE TYPE user_role AS ENUM ('user', 'admin', 'superuser');
CREATE TYPE project_member_role AS ENUM ('viewer', 'editor', 'admin');
CREATE TYPE message_role AS ENUM ('user', 'assistant');

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  avatar text,
  role user_role NOT NULL DEFAULT 'user',
  last_project_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Таблица проектов
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  connection_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name)
);

-- Таблица участников проектов
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role project_member_role NOT NULL DEFAULT 'viewer',
  added_by uuid NOT NULL REFERENCES users(id),
  added_at timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Таблица подключений к базам данных
CREATE TABLE IF NOT EXISTS database_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  host text NOT NULL,
  port integer NOT NULL DEFAULT 5432,
  username text NOT NULL,
  password text NOT NULL,
  database text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Таблица чатов
CREATE TABLE IF NOT EXISTS chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Таблица сообщений
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content text NOT NULL,
  sql_query text,
  created_at timestamptz DEFAULT now()
);

-- Таблица заметок пользователей
CREATE TABLE IF NOT EXISTS user_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Таблица примеров SQL
CREATE TABLE IF NOT EXISTS sql_examples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  natural_language_query text NOT NULL,
  sql_query text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Таблица метаданных таблиц
CREATE TABLE IF NOT EXISTS table_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  schema_name text NOT NULL,
  table_name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(project_id, schema_name, table_name)
);

-- Таблица метаданных колонок
CREATE TABLE IF NOT EXISTS column_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_metadata_id uuid NOT NULL REFERENCES table_metadata(id) ON DELETE CASCADE,
  column_name text NOT NULL,
  data_type text NOT NULL,
  is_nullable boolean NOT NULL DEFAULT true,
  is_primary_key boolean NOT NULL DEFAULT false,
  is_foreign_key boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(table_metadata_id, column_name)
);

-- Таблица настроек приложения
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rag_examples_count integer NOT NULL DEFAULT 3,
  debug_mode boolean NOT NULL DEFAULT false,
  rag_similarity_threshold decimal(3,2) NOT NULL DEFAULT 0.40,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Включение RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE database_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sql_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE column_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Политики для пользователей
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid()::text = id::text);

-- Политики для проектов
CREATE POLICY "Users can read accessible projects" ON projects
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id
      AND pm.user_id::text = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'superuser'
    )
  );

CREATE POLICY "Superusers can create projects" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'superuser'
    )
  );

CREATE POLICY "Project admins can update projects" ON projects
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = projects.id
      AND pm.user_id::text = auth.uid()::text
      AND pm.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'superuser'
    )
  );

-- Политики для участников проектов
CREATE POLICY "Users can read project members" ON project_members
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id::text = auth.uid()::text
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'superuser'
    )
  );

CREATE POLICY "Project admins can manage members" ON project_members
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = project_members.project_id
      AND pm.user_id::text = auth.uid()::text
      AND pm.role = 'admin'
    )
    OR EXISTS (
      SELECT 1 FROM users u
      WHERE u.id::text = auth.uid()::text
      AND u.role = 'superuser'
    )
  );

-- Политики для подключений к БД
CREATE POLICY "Project members can read connections" ON database_connections
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = database_connections.project_id
      AND pm.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Project editors can manage connections" ON database_connections
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = database_connections.project_id
      AND pm.user_id::text = auth.uid()::text
      AND pm.role IN ('editor', 'admin')
    )
  );

-- Политики для чатов
CREATE POLICY "Users can read own chats" ON chats
  FOR SELECT TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create chats in accessible projects" ON chats
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id::text = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = chats.project_id
      AND pm.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update own chats" ON chats
  FOR UPDATE TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can delete own chats" ON chats
  FOR DELETE TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Политики для сообщений
CREATE POLICY "Users can read messages from own chats" ON messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id = messages.chat_id
      AND c.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create messages in own chats" ON messages
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chats c
      WHERE c.id = messages.chat_id
      AND c.user_id::text = auth.uid()::text
    )
  );

-- Политики для заметок
CREATE POLICY "Users can manage own notes" ON user_notes
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Политики для SQL примеров
CREATE POLICY "Users can manage own sql examples" ON sql_examples
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Политики для метаданных таблиц
CREATE POLICY "Project members can read table metadata" ON table_metadata
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = table_metadata.project_id
      AND pm.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Project editors can manage table metadata" ON table_metadata
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM project_members pm
      WHERE pm.project_id = table_metadata.project_id
      AND pm.user_id::text = auth.uid()::text
      AND pm.role IN ('editor', 'admin')
    )
  );

-- Политики для метаданных колонок
CREATE POLICY "Users can read column metadata" ON column_metadata
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM table_metadata tm
      JOIN project_members pm ON pm.project_id = tm.project_id
      WHERE tm.id = column_metadata.table_metadata_id
      AND pm.user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Project editors can manage column metadata" ON column_metadata
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM table_metadata tm
      JOIN project_members pm ON pm.project_id = tm.project_id
      WHERE tm.id = column_metadata.table_metadata_id
      AND pm.user_id::text = auth.uid()::text
      AND pm.role IN ('editor', 'admin')
    )
  );

-- Политики для настроек приложения
CREATE POLICY "Users can manage own settings" ON app_settings
  FOR ALL TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_project_id ON chats(project_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_notes_project_id ON user_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_sql_examples_user_id ON sql_examples(user_id);
CREATE INDEX IF NOT EXISTS idx_sql_examples_project_id ON sql_examples(project_id);
CREATE INDEX IF NOT EXISTS idx_table_metadata_project_id ON table_metadata(project_id);
CREATE INDEX IF NOT EXISTS idx_column_metadata_table_id ON column_metadata(table_metadata_id);

-- Обновление внешнего ключа для связи проекта с подключением
ALTER TABLE projects 
ADD CONSTRAINT fk_projects_connection 
FOREIGN KEY (connection_id) REFERENCES database_connections(id) ON DELETE SET NULL;