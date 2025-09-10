import React, { createContext, useContext, useState, useEffect } from 'react';
import { Chat, UserNote, SqlExample, AppSettings, DatabaseConnection, TableMetadata, Message } from '../types';
import { useProject } from './ProjectContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface AppContextType {
  // Chats
  chats: Chat[];
  currentChat: Chat | null;
  createChat: (name: string) => Promise<Chat>;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, newName: string) => Promise<void>;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  
  // Notes
  notes: UserNote[];
  createNote: (title: string, content: string) => Promise<UserNote>;
  updateNote: (id: string, title: string, content: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  
  // SQL Examples
  sqlExamples: SqlExample[];
  createSqlExample: (naturalLanguageQuery: string, sqlQuery: string) => Promise<void>;
  updateSqlExample: (id: string, naturalLanguageQuery: string, sqlQuery: string) => Promise<void>;
  deleteSqlExample: (id: string) => Promise<void>;
  
  // Settings
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  
  // Database Connections
  connections: DatabaseConnection[];
  selectedConnection: DatabaseConnection | null;
  createConnection: (connection: Omit<DatabaseConnection, 'id'>) => Promise<void>;
  updateConnection: (id: string, connection: Partial<DatabaseConnection>) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  selectConnection: (id: string) => void;
  
  // Metadata
  metadata: TableMetadata[];
  updateMetadata: (metadata: TableMetadata[]) => void;
  
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(false);

  // Load data when project changes
  useEffect(() => {
    if (user && currentProject) {
      loadAllData();
    } else {
      clearData();
    }
  }, [user, currentProject]);

  const clearData = () => {
    setChats([]);
    setCurrentChat(null);
    setNotes([]);
    setSqlExamples([]);
    setConnections([]);
    setSelectedConnection(null);
    setMetadata([]);
  };

  const loadAllData = async () => {
    if (!user || !currentProject) return;

    setIsLoading(true);
    try {
      await Promise.all([
        loadChats(),
        loadNotes(),
        loadSqlExamples(),
        loadConnections(),
        loadSettings()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChats = async () => {
    if (!user || !currentProject) return;

    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          messages (*)
        `)
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading chats:', error);
        return;
      }

      const chatsData = data.map(c => ({
        id: c.id,
        name: c.name,
        userId: c.user_id,
        projectId: c.project_id,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
        messages: (c.messages || []).map((m: any) => ({
          id: m.id,
          chatId: m.chat_id,
          role: m.role,
          content: m.content,
          sqlQuery: m.sql_query,
          timestamp: new Date(m.created_at)
        }))
      }));

      setChats(chatsData);

      // Select first chat if none selected
      if (chatsData.length > 0 && !currentChat) {
        setCurrentChat(chatsData[0]);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadNotes = async () => {
    if (!user || !currentProject) return;

    try {
      const { data, error } = await supabase
        .from('user_notes')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading notes:', error);
        return;
      }

      const notesData = data.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        userId: n.user_id,
        projectId: n.project_id,
        createdAt: new Date(n.created_at),
        updatedAt: new Date(n.updated_at)
      }));

      setNotes(notesData);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const loadSqlExamples = async () => {
    if (!user || !currentProject) return;

    try {
      const { data, error } = await supabase
        .from('sql_examples')
        .select('*')
        .eq('project_id', currentProject.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading SQL examples:', error);
        return;
      }

      const examplesData = data.map(e => ({
        id: e.id,
        naturalLanguageQuery: e.natural_language_query,
        sqlQuery: e.sql_query,
        userId: e.user_id,
        projectId: e.project_id,
        createdAt: new Date(e.created_at)
      }));

      setSqlExamples(examplesData);
    } catch (error) {
      console.error('Error loading SQL examples:', error);
    }
  };

  const loadConnections = async () => {
    if (!user || !currentProject) return;

    try {
      const { data, error } = await supabase
        .from('database_connections')
        .select('*')
        .eq('project_id', currentProject.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading connections:', error);
        return;
      }

      const connectionsData = data.map(c => ({
        id: c.id,
        name: c.name,
        host: c.host,
        port: c.port,
        username: c.username,
        password: c.password,
        database: c.database
      }));

      setConnections(connectionsData);

      // Select first connection if none selected
      if (connectionsData.length > 0 && !selectedConnection) {
        setSelectedConnection(connectionsData[0]);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
    }
  };

  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        return;
      }

      if (data) {
        setSettings({
          ragExamplesCount: data.rag_examples_count,
          debugMode: data.debug_mode,
          ragSimilarityThreshold: parseFloat(data.rag_similarity_threshold)
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // Chat methods
  const createChat = async (name: string): Promise<Chat> => {
    if (!user || !currentProject) throw new Error('No user or project');

    const { data, error } = await supabase
      .from('chats')
      .insert({
        name,
        user_id: user.id,
        project_id: currentProject.id
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

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
  };

  const selectChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChat(chat);
    }
  };

  const deleteChat = async (chatId: string) => {
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId);

    if (error) throw new Error(error.message);

    setChats(prev => prev.filter(c => c.id !== chatId));
    if (currentChat?.id === chatId) {
      setCurrentChat(null);
    }
  };

  const renameChat = async (chatId: string, newName: string) => {
    const { error } = await supabase
      .from('chats')
      .update({ name: newName })
      .eq('id', chatId);

    if (error) throw new Error(error.message);

    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, name: newName, updatedAt: new Date() } : c
    ));
    if (currentChat?.id === chatId) {
      setCurrentChat(prev => prev ? { ...prev, name: newName } : null);
    }
  };

  const addMessage = async (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: message.role,
        content: message.content,
        sql_query: message.sqlQuery
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    const newMessage: Message = {
      id: data.id,
      chatId: data.chat_id,
      role: data.role,
      content: data.content,
      sqlQuery: data.sql_query,
      timestamp: new Date(data.created_at)
    };

    // Update chat messages
    setChats(prev => prev.map(c => 
      c.id === chatId 
        ? { ...c, messages: [...c.messages, newMessage] }
        : c
    ));

    if (currentChat?.id === chatId) {
      setCurrentChat(prev => prev 
        ? { ...prev, messages: [...prev.messages, newMessage] }
        : null
      );
    }
  };

  // Notes methods
  const createNote = async (title: string, content: string): Promise<UserNote> => {
    if (!user || !currentProject) throw new Error('No user or project');

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

    if (error) throw new Error(error.message);

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
  };

  const updateNote = async (id: string, title: string, content: string) => {
    const { error } = await supabase
      .from('user_notes')
      .update({ title, content })
      .eq('id', id);

    if (error) throw new Error(error.message);

    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, title, content, updatedAt: new Date() } : note
    ));
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase
      .from('user_notes')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    setNotes(prev => prev.filter(note => note.id !== id));
  };

  // SQL Examples methods
  const createSqlExample = async (naturalLanguageQuery: string, sqlQuery: string) => {
    if (!user || !currentProject) throw new Error('No user or project');

    const { error } = await supabase
      .from('sql_examples')
      .insert({
        natural_language_query: naturalLanguageQuery,
        sql_query: sqlQuery,
        user_id: user.id,
        project_id: currentProject.id
      });

    if (error) throw new Error(error.message);

    await loadSqlExamples();
  };

  const updateSqlExample = async (id: string, naturalLanguageQuery: string, sqlQuery: string) => {
    const { error } = await supabase
      .from('sql_examples')
      .update({
        natural_language_query: naturalLanguageQuery,
        sql_query: sqlQuery
      })
      .eq('id', id);

    if (error) throw new Error(error.message);

    setSqlExamples(prev => prev.map(example => 
      example.id === id ? { ...example, naturalLanguageQuery, sqlQuery } : example
    ));
  };

  const deleteSqlExample = async (id: string) => {
    const { error } = await supabase
      .from('sql_examples')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    setSqlExamples(prev => prev.filter(example => example.id !== id));
  };

  // Settings methods
  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!user) return;

    const updatedSettings = { ...settings, ...newSettings };

    const { error } = await supabase
      .from('app_settings')
      .upsert({
        user_id: user.id,
        rag_examples_count: updatedSettings.ragExamplesCount,
        debug_mode: updatedSettings.debugMode,
        rag_similarity_threshold: updatedSettings.ragSimilarityThreshold
      });

    if (error) throw new Error(error.message);

    setSettings(updatedSettings);
  };

  // Connection methods
  const createConnection = async (connection: Omit<DatabaseConnection, 'id'>) => {
    if (!currentProject) throw new Error('No project selected');

    const { error } = await supabase
      .from('database_connections')
      .insert({
        project_id: currentProject.id,
        name: connection.name,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password,
        database: connection.database
      });

    if (error) throw new Error(error.message);

    await loadConnections();
  };

  const updateConnection = async (id: string, connection: Partial<DatabaseConnection>) => {
    const { error } = await supabase
      .from('database_connections')
      .update({
        name: connection.name,
        host: connection.host,
        port: connection.port,
        username: connection.username,
        password: connection.password,
        database: connection.database
      })
      .eq('id', id);

    if (error) throw new Error(error.message);

    await loadConnections();
  };

  const deleteConnection = async (id: string) => {
    const { error } = await supabase
      .from('database_connections')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);

    if (selectedConnection?.id === id) {
      setSelectedConnection(null);
    }

    await loadConnections();
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
      addMessage,
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
      updateMetadata,
      isLoading
    }}>
      {children}
    </AppContext.Provider>
  );
}