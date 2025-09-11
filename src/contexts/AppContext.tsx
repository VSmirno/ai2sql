import React, { createContext, useContext, useState, useEffect } from 'react';
import { Chat, UserNote, SqlExample, AppSettings, DatabaseConnection, TableMetadata, Message, User } from '../types';
import { useProject } from './ProjectContext';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface AppContextType {
  // Users
  allUsers: User[];
  loadAllUsers: () => Promise<void>;
  
  // Chats
  chats: Chat[];
  currentChat: Chat | null;
  createChat: (name: string) => Chat;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => Promise<void>;
  renameChat: (chatId: string, newName: string) => Promise<void>;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  
  // Notes
  notes: UserNote[];
  createNote: (title: string, content: string) => UserNote;
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
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
      loadData();
    } else if (user) {
      // Load users even without a project for admin functionality
      loadAllUsers();
    } else {
      clearData();
    }
  }, [user, currentProject]);

  const clearData = () => {
    setAllUsers([]);
    setChats([]);
    setCurrentChat(null);
    setNotes([]);
    setSqlExamples([]);
    setConnections([]);
    setSelectedConnection(null);
    setMetadata([]);
  };

  const loadData = async () => {
    if (!user || !currentProject) return;

    setIsLoading(true);
    try {
      await Promise.all([
        loadAllUsers(),
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

  const loadAllUsers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedUsers = data.map(u => ({
        id: u.id,
        email: u.email,
        name: u.name,
        avatar: u.avatar,
        role: u.role as 'user' | 'admin' | 'superuser',
        lastProjectId: u.last_project_id
      }));

      setAllUsers(mappedUsers);
    } catch (error) {
      console.error('Error loading all users:', error);
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

      if (error) throw error;

      const mappedChats = data.map(c => ({
        id: c.id,
        name: c.name,
        userId: c.user_id,
        projectId: c.project_id,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
        messages: c.messages.map((m: any) => ({
          id: m.id,
          chatId: m.chat_id,
          role: m.role,
          content: m.content,
          sqlQuery: m.sql_query,
          timestamp: new Date(m.created_at)
        }))
      }));

      setChats(mappedChats);
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

      if (error) throw error;

      const mappedNotes = data.map(n => ({
        id: n.id,
        title: n.title,
        content: n.content,
        userId: n.user_id,
        projectId: n.project_id,
        createdAt: new Date(n.created_at),
        updatedAt: new Date(n.updated_at)
      }));

      setNotes(mappedNotes);
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedExamples = data.map(e => ({
        id: e.id,
        naturalLanguageQuery: e.natural_language_query,
        sqlQuery: e.sql_query,
        userId: e.user_id,
        projectId: e.project_id,
        createdAt: new Date(e.created_at)
      }));

      setSqlExamples(mappedExamples);
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

      if (error) throw error;

      const mappedConnections = data.map(c => ({
        id: c.id,
        name: c.name,
        host: c.host,
        port: c.port,
        username: c.username,
        password: c.password,
        database: c.database
      }));

      setConnections(mappedConnections);
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
        .maybeSingle();

      if (error) throw error;

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
  const createChat = (name: string): Chat => {
    if (!user || !currentProject) throw new Error('No user or project');

    const newChat: Chat = {
      id: `temp-${Date.now()}`,
      name,
      userId: user.id,
      projectId: currentProject.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };

    // Insert into database
    supabase
      .from('chats')
      .insert({
        name: newChat.name,
        user_id: newChat.userId,
        project_id: newChat.projectId
      })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error creating chat:', error);
          return;
        }
        
        const dbChat = {
          ...newChat,
          id: data.id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };

        setChats(prev => prev.map(c => 
          c.id === newChat.id ? dbChat : c
        ));
      });

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
        .update({ name: newName })
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

  const addMessage = async (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      id: `temp-${Date.now()}`,
      chatId,
      role: message.role,
      content: message.content,
      sqlQuery: message.sqlQuery,
      timestamp: new Date()
    };

    // Insert into database
    supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role: message.role,
        content: message.content,
        sql_query: message.sqlQuery
      })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error creating message:', error);
          return;
        }
        
        const dbMessage = {
          ...newMessage,
          id: data.id,
          timestamp: new Date(data.created_at)
        };

        // Update chat messages
        setChats(prev => prev.map(c => 
          c.id === chatId 
            ? { ...c, messages: c.messages.map(m => m.id === newMessage.id ? dbMessage : m) }
            : c
        ));

        if (currentChat?.id === chatId) {
          setCurrentChat(prev => prev 
            ? { ...prev, messages: prev.messages.map(m => m.id === newMessage.id ? dbMessage : m) }
            : null
          );
        }
      });

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
  const createNote = (title: string, content: string): UserNote => {
    if (!user || !currentProject) throw new Error('No user or project');

    const newNote: UserNote = {
      id: `temp-${Date.now()}`,
      title,
      content,
      userId: user.id,
      projectId: currentProject.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert into database
    supabase
      .from('user_notes')
      .insert({
        title: newNote.title,
        content: newNote.content,
        user_id: newNote.userId,
        project_id: newNote.projectId
      })
      .select()
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error creating note:', error);
          return;
        }
        
        const dbNote = {
          ...newNote,
          id: data.id,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };

        setNotes(prev => prev.map(n => 
          n.id === newNote.id ? dbNote : n
        ));
      });

    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = async (id: string, title: string, content: string) => {
    try {
      const { error } = await supabase
        .from('user_notes')
        .update({ title, content })
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

  // SQL Examples methods
  const createSqlExample = async (naturalLanguageQuery: string, sqlQuery: string) => {
    if (!user || !currentProject) throw new Error('No user or project');

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

  // Settings methods
  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    if (!user) return;

    const updatedSettings = { ...settings, ...newSettings };
    
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          user_id: user.id,
          rag_examples_count: updatedSettings.ragExamplesCount,
          debug_mode: updatedSettings.debugMode,
          rag_similarity_threshold: updatedSettings.ragSimilarityThreshold
        });

      if (error) throw error;

      setSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  };

  // Connection methods
  const createConnection = async (connection: Omit<DatabaseConnection, 'id'>) => {
    if (!currentProject) throw new Error('No current project');

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

      setConnections(prev => [newConnection, ...prev]);
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
          database: connection.database
        })
        .eq('id', id);

      if (error) throw error;

      setConnections(prev => prev.map(c => 
        c.id === id ? { ...c, ...connection } : c
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

      setConnections(prev => prev.filter(c => c.id !== id));

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
      allUsers,
      loadAllUsers,
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