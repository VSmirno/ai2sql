export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface Chat {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  sqlQuery?: string;
  timestamp: Date;
}

export interface DatabaseConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface TableMetadata {
  id: string;
  schema: string;
  table: string;
  columns: ColumnMetadata[];
  description?: string;
}

export interface ColumnMetadata {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  description?: string;
}

export interface UserNote {
  id: string;
  title: string;
  content: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SqlExample {
  id: string;
  naturalLanguageQuery: string;
  sqlQuery: string;
  userId: string;
  createdAt: Date;
}

export interface AppSettings {
  ragExamplesCount: number;
  debugMode: boolean;
  ragSimilarityThreshold: number;
}