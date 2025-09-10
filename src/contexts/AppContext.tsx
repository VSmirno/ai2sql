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
      loadLocalData();
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

  const loadLocalData = async () => {
    if (!user || !currentProject) return;

    setIsLoading(true);
    try {
      // Создаем дефолтные данные
      setChats([]);
      setNotes([]);
      setSqlExamples([]);
      setConnections([]);
      setSettings({
        ragExamplesCount: 3,
        debugMode: true,
        ragSimilarityThreshold: 0.40
      });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Chat methods
  const createChat = async (name: string): Promise<Chat> => {
    if (!user || !currentProject) throw new Error('No user or project');

    const newChat: Chat = {
      id: `chat-${Date.now()}`,
      name,
      userId: user.id,
      projectId: currentProject.id,
      createdAt: new Date(),
      updatedAt: new Date(),
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
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (currentChat?.id === chatId) {
      setCurrentChat(null);
    }
  };

  const renameChat = async (chatId: string, newName: string) => {
    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, name: newName, updatedAt: new Date() } : c
    ));
    if (currentChat?.id === chatId) {
      setCurrentChat(prev => prev ? { ...prev, name: newName } : null);
    }
  };

  const addMessage = async (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      id: `message-${Date.now()}`,
      chatId,
      role: message.role,
      content: message.content,
      sqlQuery: message.sqlQuery,
      timestamp: new Date()
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

    const newNote: UserNote = {
      id: `note-${Date.now()}`,
      title,
      content,
      userId: user.id,
      projectId: currentProject.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = async (id: string, title: string, content: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, title, content, updatedAt: new Date() } : note
    ));
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  // SQL Examples methods
  const createSqlExample = async (naturalLanguageQuery: string, sqlQuery: string) => {
    if (!user || !currentProject) throw new Error('No user or project');

    const newExample: SqlExample = {
      id: `example-${Date.now()}`,
      naturalLanguageQuery,
      sqlQuery,
      userId: user.id,
      projectId: currentProject.id,
      createdAt: new Date()
    };

    setSqlExamples(prev => [newExample, ...prev]);
  };

  const updateSqlExample = async (id: string, naturalLanguageQuery: string, sqlQuery: string) => {
    setSqlExamples(prev => prev.map(example => 
      example.id === id ? { ...example, naturalLanguageQuery, sqlQuery } : example
    ));
  };

  const deleteSqlExample = async (id: string) => {
    setSqlExamples(prev => prev.filter(example => example.id !== id));
  };

  // Settings methods
  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
  };

  // Connection methods
  const createConnection = async (connection: Omit<DatabaseConnection, 'id'>) => {
    const newConnection: DatabaseConnection = {
      id: `connection-${Date.now()}`,
      ...connection
    };

    setConnections(prev => [newConnection, ...prev]);
  };

  const updateConnection = async (id: string, connection: Partial<DatabaseConnection>) => {
    setConnections(prev => prev.map(c => 
      c.id === id ? { ...c, ...connection } : c
    ));
  };

  const deleteConnection = async (id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));

    if (selectedConnection?.id === id) {
      setSelectedConnection(null);
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