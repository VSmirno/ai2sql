/*
  # Create all necessary tables for AI2SQL application

  1. New Tables
    - `users` - User profiles with roles and settings
    - `projects` - Projects for organizing work
    - `project_members` - Project membership with roles
    - `database_connections` - Database connection configurations
    - `chats` - Chat sessions for SQL generation
    - `messages` - Messages within chats
    - `user_notes` - User notes for projects
    - `sql_examples` - Reference SQL examples for RAG
    - `table_metadata` - Database table metadata
    - `column_metadata` - Database column metadata
    - `app_settings` - User application settings

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Ensure users can only access their own data or shared project data

  3. Functions
    - Update timestamp trigger function
    - New user creation trigger
*/

-- Create enum types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'superuser');
CREATE TYPE project_member_role AS ENUM ('viewer', 'editor', 'admin');
CREATE TYPE message_role AS ENUM ('user', 'assistant');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        CASE 
            WHEN NEW.email = 'admin@ai.ru' THEN 'superuser'::user_role
            ELSE 'user'::user_role
        END
    );
    RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text UNIQUE NOT NULL,
    name text NOT NULL,
    avatar text,
    role user_role DEFAULT 'user',
    last_project_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Enable insert for authenticated users"
    ON users
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role can manage users"
    ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    description text,
    created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    connection_id uuid,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read projects they are members of"
    ON projects
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = projects.id
            AND pm.user_id = auth.uid()
        )
        OR created_by = auth.uid()
    );

CREATE POLICY "Project creators can manage their projects"
    ON projects
    FOR ALL
    TO authenticated
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- Project members table
CREATE TABLE IF NOT EXISTS project_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role project_member_role DEFAULT 'viewer',
    added_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    added_at timestamptz DEFAULT now(),
    UNIQUE(project_id, user_id)
);

ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read project memberships they are part of"
    ON project_members
    FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = project_members.project_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('admin', 'editor')
        )
    );

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
        )
        OR EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_members.project_id
            AND p.created_by = auth.uid()
        )
    );

-- Database connections table
CREATE TABLE IF NOT EXISTS database_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name text NOT NULL,
    host text NOT NULL,
    port integer DEFAULT 5432,
    username text NOT NULL,
    password text NOT NULL,
    database text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE database_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can read connections"
    ON database_connections
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = database_connections.project_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Project editors can manage connections"
    ON database_connections
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = database_connections.project_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('admin', 'editor')
        )
    );

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own chats"
    ON chats
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can create chats in accessible projects"
    ON chats
    FOR INSERT
    TO authenticated
    WITH CHECK (
        user_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = chats.project_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own chats"
    ON chats
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own chats"
    ON chats
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id uuid NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content text NOT NULL,
    sql_query text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

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

-- User notes table
CREATE TABLE IF NOT EXISTS user_notes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes"
    ON user_notes
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- SQL examples table
CREATE TABLE IF NOT EXISTS sql_examples (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    natural_language_query text NOT NULL,
    sql_query text NOT NULL,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE sql_examples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sql examples"
    ON sql_examples
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Table metadata
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

ALTER TABLE table_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Project members can read table metadata"
    ON table_metadata
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = table_metadata.project_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Project editors can manage table metadata"
    ON table_metadata
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            WHERE pm.project_id = table_metadata.project_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('admin', 'editor')
        )
    );

-- Column metadata
CREATE TABLE IF NOT EXISTS column_metadata (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    table_metadata_id uuid NOT NULL REFERENCES table_metadata(id) ON DELETE CASCADE,
    column_name text NOT NULL,
    data_type text NOT NULL,
    is_nullable boolean DEFAULT true,
    is_primary_key boolean DEFAULT false,
    is_foreign_key boolean DEFAULT false,
    description text,
    created_at timestamptz DEFAULT now(),
    UNIQUE(table_metadata_id, column_name)
);

ALTER TABLE column_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read column metadata"
    ON column_metadata
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM table_metadata tm
            JOIN project_members pm ON pm.project_id = tm.project_id
            WHERE tm.id = column_metadata.table_metadata_id
            AND pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Project editors can manage column metadata"
    ON column_metadata
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM table_metadata tm
            JOIN project_members pm ON pm.project_id = tm.project_id
            WHERE tm.id = column_metadata.table_metadata_id
            AND pm.user_id = auth.uid()
            AND pm.role IN ('admin', 'editor')
        )
    );

-- App settings table
CREATE TABLE IF NOT EXISTS app_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rag_examples_count integer DEFAULT 3,
    debug_mode boolean DEFAULT false,
    rag_similarity_threshold numeric(3,2) DEFAULT 0.40,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings"
    ON app_settings
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Add foreign key constraint for projects connection_id
ALTER TABLE projects 
ADD CONSTRAINT fk_projects_connection 
FOREIGN KEY (connection_id) REFERENCES database_connections(id) ON DELETE SET NULL;

-- Create indexes for better performance
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

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_database_connections_updated_at
    BEFORE UPDATE ON database_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON chats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_notes_updated_at
    BEFORE UPDATE ON user_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_metadata_updated_at
    BEFORE UPDATE ON table_metadata
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();