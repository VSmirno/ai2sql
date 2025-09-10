import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Chat, UserNote, SqlExample, AppSettings, DatabaseConnection, TableMetadata } from '../types';
import { useProject } from './ProjectContext';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface AppContextType {
  // Chats
  chats: Chat[];
  currentChat: Chat | null;
  createChat: (name: string) => Chat;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  renameChat: (chatId: string, newName: string) => void;
  
  // Notes
  notes: UserNote[];
  createNote: (title: string, content: string) => UserNote;
  updateNote: (id: string, title: string, content: string) => void;
  deleteNote: (id: string) => void;
  
  // SQL Examples
  sqlExamples: SqlExample[];
  createSqlExample: (naturalLanguageQuery: string, sqlQuery: string) => void;
  updateSqlExample: (id: string, naturalLanguageQuery: string, sqlQuery: string) => void;
  deleteSqlExample: (id: string) => void;
  
  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  
  // Database Connections
  connections: DatabaseConnection[];
  selectedConnection: DatabaseConnection | null;
  createConnection: (connection: Omit<DatabaseConnection, 'id'>) => void;
  updateConnection: (id: string, connection: Partial<DatabaseConnection>) => void;
  deleteConnection: (id: string) => void;
  selectConnection: (id: string) => void;
  
  // Metadata
  metadata: TableMetadata[];
  updateMetadata: (metadata: TableMetadata[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { currentProject } = useProject();
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [sqlExamples, setSqlExamples] = useState<SqlExample[]>([]);
  const [connections, setConnections] = useState<DatabaseConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<DatabaseConnection | null>(null);
  const [metadata, setMetadata] = useState<TableMetadata[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    ragExamplesCount: 3,
    debugMode: true,
    ragSimilarityThreshold: 0.40
  });

  // Initialize with mock data
  useEffect(() => {
    if (currentProject?.id) {
      loadProjectData();
    } else {
      clearProjectData();
    }
  }, [currentProject?.id]);

  const clearProjectData = () => {
    setChats([]);
    setCurrentChat(null);
    setNotes([]);
    setSqlExamples([]);
    setConnections([]);
    setSelectedConnection(null);
    setMetadata([]);
  };

  const loadProjectData = async () => {
    if (!currentProject?.id) return;

    try {
      // Load chats
      const { data: chatsData } = await supabase
        .from('chats')
        .select(`
          *,
          messages (*)
        `)
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });

      if (chatsData) {
        const loadedChats = chatsData.map(chat => ({
          id: chat.id,
          name: chat.name,
          userId: chat.user_id,
          projectId: chat.project_id,
          createdAt: new Date(chat.created_at),
          updatedAt: new Date(chat.updated_at),
          messages: chat.messages?.map((msg: any) => ({
            id: msg.id,
            chatId: msg.chat_id,
            role: msg.role,
            content: msg.content,
            sqlQuery: msg.sql_query,
            timestamp: new Date(msg.created_at)
          })) || []
        }));
        setChats(loadedChats);
      }

      // Load notes
      const { data: notesData } = await supabase
        .from('user_notes')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });

      if (notesData) {
        const loadedNotes = notesData.map(note => ({
          id: note.id,
          title: note.title,
          content: note.content,
          userId: note.user_id,
          projectId: note.project_id,
          createdAt: new Date(note.created_at),
          updatedAt: new Date(note.updated_at)
        }));
        setNotes(loadedNotes);
      }

      // Load SQL examples
      const { data: examplesData } = await supabase
        .from('sql_examples')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });

      if (examplesData) {
        const loadedExamples = examplesData.map(example => ({
          id: example.id,
          naturalLanguageQuery: example.natural_language_query,
          sqlQuery: example.sql_query,
          userId: example.user_id,
          projectId: example.project_id,
          createdAt: new Date(example.created_at)
        }));
        setSqlExamples(loadedExamples);
      }

      // Load database connections
      const { data: connectionsData } = await supabase
        .from('database_connections')
        .select('*')
        .eq('project_id', currentProject.id);

      if (connectionsData) {
        const loadedConnections = connectionsData.map(conn => ({
          id: conn.id,
          name: conn.name,
          host: conn.host,
          port: conn.port,
          username: conn.username,
          password: conn.password,
          database: conn.database
        }));
        setConnections(loadedConnections);
        if (loadedConnections.length > 0) {
          setSelectedConnection(loadedConnections[0]);
        }
      }

    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  const createChat = async (name: string): Promise<Chat> => {
    if (!currentProject) throw new Error('No project selected');
    if (!user?.id) throw new Error('User not authenticated');
    
    // Создаем чат локально без базы данных
    const newChat: Chat = {
      id: uuidv4(),
      name,
      userId: user?.id || '',
      projectId: currentProject.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };
    
    setChats(prev => [newChat, ...prev]);
    return newChat;
  };

  const createChatAsync = async (name: string): Promise<Chat> => {
    if (!currentProject) throw new Error('No project selected');
    if (!user?.id) throw new Error('User not authenticated');
    
    try {
      const { data, error } = await supabase
        .from('chats')
        .insert({
          name,
          user_id: user.id,
          project_id: currentProject.id
        })
        .select()
        .single();

      if (error) throw error;

      const newChat: Chat = {
        id: data.id,
        name: data.name,
        userId: data.user_id,
        projectId: data.project_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        messages: []
      };
      
      setChats(prev => [newChat, ...prev]);
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  };

  const selectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (error) throw error;

      setChats(prev => prev.filter(c => c.id !== chatId));
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  };

  const renameChat = async (chatId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('chats')
        .update({ 
          name: newName,
          updated_at: new Date().toISOString()
        })
        .eq('id', chatId);

      if (error) throw error;

      setChats(prev => prev.map(c => 
        c.id === chatId ? { ...c, name: newName, updatedAt: new Date() } : c
      ));
      if (currentChat?.id === chatId) {
        setCurrentChat(prev => prev ? { ...prev, name: newName } : null);
      }
    } catch (error) {
      console.error('Error renaming chat:', error);
      throw error;
    }
  };

  const createNote = async (title: string, content: string): Promise<UserNote> => {
    if (!currentProject) throw new Error('No project selected');
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('user_notes')
        .insert({
          title,
          content,
          user_id: user.id,
          project_id: currentProject.id
        })
        .select()
        .single();

      if (error) throw error;

      const newNote: UserNote = {
        id: data.id,
        title: data.title,
        content: data.content,
        userId: data.user_id,
        projectId: data.project_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
      
      setNotes(prev => [newNote, ...prev]);
      return newNote;
    } catch (error) {
      console.error('Error creating note:', error);
      throw error;
    }
  };

  const updateNote = async (id: string, title: string, content: string) => {
    try {
      const { error } = await supabase
        .from('user_notes')
        .update({
          title,
          content,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setNotes(prev => prev.map(note => 
        note.id === id ? { ...note, title, content, updatedAt: new Date() } : note
      ));
    } catch (error) {
      console.error('Error updating note:', error);
      throw error;
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
      throw error;
    }
  };

  const createSqlExample = async (naturalLanguageQuery: string, sqlQuery: string) => {
    if (!currentProject) throw new Error('No project selected');
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('sql_examples')
        .insert({
          natural_language_query: naturalLanguageQuery,
          sql_query: sqlQuery,
          user_id: user.id,
          project_id: currentProject.id
        })
        .select()
        .single();

      if (error) throw error;

      const newExample: SqlExample = {
        id: data.id,
        naturalLanguageQuery: data.natural_language_query,
        sqlQuery: data.sql_query,
        userId: data.user_id,
        projectId: data.project_id,
        createdAt: new Date(data.created_at)
      };
      
      setSqlExamples(prev => [newExample, ...prev]);
    } catch (error) {
      console.error('Error creating SQL example:', error);
      throw error;
    }
  };

  const updateSqlExample = async (id: string, naturalLanguageQuery: string, sqlQuery: string) => {
    try {
      const { error } = await supabase
        .from('sql_examples')
        .update({
          natural_language_query: naturalLanguageQuery,
          sql_query: sqlQuery
        })
        .eq('id', id);

      if (error) throw error;

      setSqlExamples(prev => prev.map(example => 
        example.id === id ? { ...example, naturalLanguageQuery, sqlQuery } : example
      ));
    } catch (error) {
      console.error('Error updating SQL example:', error);
      throw error;
    }
  };

  const deleteSqlExample = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sql_examples')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSqlExamples(prev => prev.filter(example => example.id !== id));
    } catch (error) {
      console.error('Error deleting SQL example:', error);
      throw error;
    }
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const createConnection = async (connection: Omit<DatabaseConnection, 'id'>) => {
    if (!currentProject) throw new Error('No project selected');
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('database_connections')
        .insert({
          project_id: currentProject.id,
          name: connection.name,
          host: connection.host,
          port: connection.port,
          username: connection.username,
          password: connection.password,
          database: connection.database
        })
        .select()
        .single();

      if (error) throw error;

      const newConnection: DatabaseConnection = {
        id: data.id,
        name: data.name,
        host: data.host,
        port: data.port,
        username: data.username,
        password: data.password,
        database: data.database
      };
      
      setConnections(prev => [...prev, newConnection]);
    } catch (error) {
      console.error('Error creating connection:', error);
      throw error;
    }
  };

  const updateConnection = async (id: string, connection: Partial<DatabaseConnection>) => {
    try {
      const { error } = await supabase
        .from('database_connections')
        .update({
          name: connection.name,
          host: connection.host,
          port: connection.port,
          username: connection.username,
          password: connection.password,
          database: connection.database,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setConnections(prev => prev.map(conn => 
        conn.id === id ? { ...conn, ...connection } : conn
      ));
      if (selectedConnection?.id === id) {
        setSelectedConnection(prev => prev ? { ...prev, ...connection } : null);
      }
    } catch (error) {
      console.error('Error updating connection:', error);
      throw error;
    }
  };

  const deleteConnection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('database_connections')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setConnections(prev => prev.filter(conn => conn.id !== id));
      if (selectedConnection?.id === id) {
        setSelectedConnection(null);
      }
    } catch (error) {
      console.error('Error deleting connection:', error);
      throw error;
    }
  };

  const selectConnection = (id: string) => {
    const connection = connections.find(c => c.id === id);
    if (connection) {
      setSelectedConnection(connection);
    }
  };

  const updateMetadata = (newMetadata: TableMetadata[]) => {
    setMetadata(newMetadata);
  };

  return (
    <AppContext.Provider value={{
      chats,
      currentChat,
      createChat,
      selectChat,
      deleteChat,
      renameChat,
      notes,
      createNote,
      updateNote,
      deleteNote,
      sqlExamples,
      createSqlExample,
      updateSqlExample,
      deleteSqlExample,
      settings,
      updateSettings,
      connections,
      selectedConnection,
      createConnection,
      updateConnection,
      deleteConnection,
      selectConnection,
      metadata,
      updateMetadata
    }}>
      {children}
    </AppContext.Provider>
  );
}