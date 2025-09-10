import React, { createContext, useContext, useState, useEffect } from 'react';
import { Chat, UserNote, SqlExample, AppSettings, DatabaseConnection, TableMetadata } from '../types';
import { useProject } from './ProjectContext';
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
    if (!currentProject) {
      // Clear data when no project is selected
      setChats([]);
      setCurrentChat(null);
      setNotes([]);
      setSqlExamples([]);
      setConnections([]);
      setSelectedConnection(null);
      setMetadata([]);
      return;
    }

    // Mock chats
    const mockChat: Chat = {
      id: uuidv4(),
      name: 'Новый чат',
      userId: '1',
      projectId: currentProject.id,
      createdAt: new Date(),
      updatedAt: new Date(),
      messages: []
    };
    setChats([mockChat]);
    setCurrentChat(mockChat);

    // Mock notes
    const mockNotes: UserNote[] = [
      {
        id: uuidv4(),
        title: 'Структура пользователей',
        content: 'Таблица users содержит информацию о пользователях системы. Поле status может быть: active, inactive, pending.',
        userId: '1',
        projectId: currentProject.id,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        title: 'Продажи и заказы',
        content: 'Orders связаны с users через user_id. Статусы заказов: draft, pending, completed, cancelled.',
        userId: '1',
        projectId: currentProject.id,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    setNotes(mockNotes);

    // Mock SQL examples
    const mockExamples: SqlExample[] = [
      {
        id: uuidv4(),
        naturalLanguageQuery: 'Найти всех активных пользователей',
        sqlQuery: 'SELECT * FROM users WHERE status = \'active\';',
        userId: '1',
        projectId: currentProject.id,
        createdAt: new Date()
      },
      {
        id: uuidv4(),
        naturalLanguageQuery: 'Получить общую сумму заказов за текущий месяц',
        sqlQuery: 'SELECT SUM(total_amount) FROM orders WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE);',
        userId: '1',
        projectId: currentProject.id,
        createdAt: new Date()
      }
    ];
    setSqlExamples(mockExamples);

    // Mock connections
    const mockConnection: DatabaseConnection = {
      id: uuidv4(),
      name: 'Production DB',
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: 'password',
      database: 'ai2sql_db'
    };
    setConnections([mockConnection]);
    setSelectedConnection(mockConnection);
  }, [currentProject]);

  const createChat = (name: string): Chat => {
    if (!currentProject) throw new Error('No project selected');
    
    const newChat: Chat = {
      id: uuidv4(),
      name,
      userId: '1',
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

  const deleteChat = (chatId: string) => {
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (currentChat?.id === chatId) {
      setCurrentChat(null);
    }
  };

  const renameChat = (chatId: string, newName: string) => {
    setChats(prev => prev.map(c => 
      c.id === chatId ? { ...c, name: newName, updatedAt: new Date() } : c
    ));
    if (currentChat?.id === chatId) {
      setCurrentChat(prev => prev ? { ...prev, name: newName } : null);
    }
  };

  const createNote = (title: string, content: string): UserNote => {
    if (!currentProject) throw new Error('No project selected');
    
    const newNote: UserNote = {
      id: uuidv4(),
      title,
      content,
      userId: '1',
      projectId: currentProject.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setNotes(prev => [newNote, ...prev]);
    return newNote;
  };

  const updateNote = (id: string, title: string, content: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, title, content, updatedAt: new Date() } : note
    ));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const createSqlExample = (naturalLanguageQuery: string, sqlQuery: string) => {
    if (!currentProject) throw new Error('No project selected');
    
    const newExample: SqlExample = {
      id: uuidv4(),
      naturalLanguageQuery,
      sqlQuery,
      userId: '1',
      projectId: currentProject.id,
      createdAt: new Date()
    };
    setSqlExamples(prev => [newExample, ...prev]);
  };

  const updateSqlExample = (id: string, naturalLanguageQuery: string, sqlQuery: string) => {
    setSqlExamples(prev => prev.map(example => 
      example.id === id ? { ...example, naturalLanguageQuery, sqlQuery } : example
    ));
  };

  const deleteSqlExample = (id: string) => {
    setSqlExamples(prev => prev.filter(example => example.id !== id));
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const createConnection = (connection: Omit<DatabaseConnection, 'id'>) => {
    const newConnection: DatabaseConnection = {
      ...connection,
      id: uuidv4()
    };
    setConnections(prev => [...prev, newConnection]);
  };

  const updateConnection = (id: string, connection: Partial<DatabaseConnection>) => {
    setConnections(prev => prev.map(conn => 
      conn.id === id ? { ...conn, ...connection } : conn
    ));
    if (selectedConnection?.id === id) {
      setSelectedConnection(prev => prev ? { ...prev, ...connection } : null);
    }
  };

  const deleteConnection = (id: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== id));
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