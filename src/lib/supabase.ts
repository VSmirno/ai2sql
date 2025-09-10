import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

          id: string;
          email: string;
          name: string;
          avatar: string | null;
          role: 'user' | 'admin' | 'superuser';
          last_project_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          avatar?: string | null;
          role?: 'user' | 'admin' | 'superuser';
          last_project_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar?: string | null;
          role?: 'user' | 'admin' | 'superuser';
          last_project_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string;
          connection_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by: string;
          connection_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_by?: string;
          connection_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_members: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          role: 'viewer' | 'editor' | 'admin';
          added_by: string;
          added_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          role?: 'viewer' | 'editor' | 'admin';
          added_by: string;
          added_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          role?: 'viewer' | 'editor' | 'admin';
          added_by?: string;
          added_at?: string;
        };
      };
      database_connections: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          host: string;
          port: number;
          username: string;
          password: string;
          database: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          name: string;
          host: string;
          port?: number;
          username: string;
          password: string;
          database: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          name?: string;
          host?: string;
          port?: number;
          username?: string;
          password?: string;
          database?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      chats: {
        Row: {
          id: string;
          name: string;
          user_id: string;
          project_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          user_id: string;
          project_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          user_id?: string;
          project_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          chat_id: string;
          role: 'user' | 'assistant';
          content: string;
          sql_query: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          chat_id: string;
          role: 'user' | 'assistant';
          content: string;
          sql_query?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          chat_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          sql_query?: string | null;
          created_at?: string;
        };
      };
      user_notes: {
        Row: {
          id: string;
          title: string;
          content: string;
          user_id: string;
          project_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          user_id: string;
          project_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          user_id?: string;
          project_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      sql_examples: {
        Row: {
          id: string;
          natural_language_query: string;
          sql_query: string;
          user_id: string;
          project_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          natural_language_query: string;
          sql_query: string;
          user_id: string;
          project_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          natural_language_query?: string;
          sql_query?: string;
          user_id?: string;
          project_id?: string;
          created_at?: string;
        };
      };
      table_metadata: {
        Row: {
          id: string;
          project_id: string;
          schema_name: string;
          table_name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          schema_name: string;
          table_name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          schema_name?: string;
          table_name?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      column_metadata: {
        Row: {
          id: string;
          table_metadata_id: string;
          column_name: string;
          data_type: string;
          is_nullable: boolean;
          is_primary_key: boolean;
          is_foreign_key: boolean;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          table_metadata_id: string;
          column_name: string;
          data_type: string;
          is_nullable?: boolean;
          is_primary_key?: boolean;
          is_foreign_key?: boolean;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          table_metadata_id?: string;
          column_name?: string;
          data_type?: string;
          is_nullable?: boolean;
          is_primary_key?: boolean;
          is_foreign_key?: boolean;
          description?: string | null;
          created_at?: string;
        };
      };
      app_settings: {
        Row: {
          id: string;
          user_id: string;
          rag_examples_count: number;
          debug_mode: boolean;
          rag_similarity_threshold: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          rag_examples_count?: number;
          debug_mode?: boolean;
          rag_similarity_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          rag_examples_count?: number;
          debug_mode?: boolean;
          rag_similarity_threshold?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}