import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, Plus, FileText, StickyNote, Settings as SettingsIcon, Bot } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { Message } from '../types';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

const Chat = () => {
  const { user } = useAuth();
  const { currentProject } = useProject();
  const { currentChat, chats, createChat, selectChat, notes } = useApp();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentMode, setAgentMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentChat?.messages]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;
    
    if (!currentChat) {
      const newChat = createChat('Новый чат');
      selectChat(newChat.id);
      return;
    }

    const userMessage: Message = {
      id: uuidv4(),
      chatId: currentChat.id,
      role: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    // Add user message
    currentChat.messages.push(userMessage);
    setMessage('');
    setIsLoading(true);

    try {
      // Simulate AI response
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const aiResponse: Message = {
        id: uuidv4(),
        chatId: currentChat.id,
        role: 'assistant',
        content: 'Вот SQL-запрос на основе вашего запроса:',
        sqlQuery: `SELECT u.id, u.name, u.email, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.status = 'active'
GROUP BY u.id, u.name, u.email
ORDER BY order_count DESC;`,
        timestamp: new Date()
      };

      currentChat.messages.push(aiResponse);
      toast.success('SQL-запрос сгенерирован');
    } catch (error) {
      toast.error('Ошибка при генерации запроса');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateResponse = () => {
    if (currentChat?.messages.length > 0) {
      handleSendMessage();
    }
  };

  const toggleNote = (noteId: string) => {
    setSelectedNotes(prev => 
      prev.includes(noteId) 
        ? prev.filter(id => id !== noteId)
        : [...prev, noteId]
    );
  };

  if (!currentChat) {
    if (!currentProject) {
      return (
        <div className="flex items-center justify-center h-full bg-white">
          <div className="text-center">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Выберите проект
            </h2>
            <p className="text-gray-500 mb-6">
              Для начала работы необходимо выбрать проект
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full bg-white">
        <div className="text-center">
          <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Добро пожаловать в AI2SQL
          </h2>
          <p className="text-gray-500 mb-6">
            Создайте новый чат, чтобы начать генерировать SQL-запросы
          </p>
          <button
            onClick={() => {
              const newChat = createChat('Новый чат');
              selectChat(newChat.id);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Новый чат</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">
              {currentChat.name}
            </h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="agentMode"
                  checked={agentMode}
                  onChange={(e) => setAgentMode(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="agentMode" className="text-sm text-gray-700">
                  Агентский режим
                </label>
              </div>
              <button
                onClick={handleRegenerateResponse}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-sm">Перегенерировать</span>
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {currentChat.messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Bot className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>Начните диалог с AI2SQL</p>
              <p className="text-sm">Опишите нужный вам SQL-запрос на естественном языке</p>
            </div>
          )}

          {currentChat.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.sqlQuery && (
                  <div className="mt-3 p-3 bg-gray-900 rounded-lg overflow-x-auto">
                    <pre className="text-green-400 text-sm">
                      <code>{msg.sqlQuery}</code>
                    </pre>
                  </div>
                )}
                <div className="text-xs opacity-70 mt-2">
                  {msg.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-4 py-3">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                  <span className="text-gray-600">Генерирую SQL-запрос...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Опишите нужный SQL-запрос..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={3}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-3 rounded-lg transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 space-y-4">
        {/* Add Notes */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <StickyNote className="w-4 h-4 mr-2" />
            Заметки пользователя
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex items-center space-x-2"
              >
                <input
                  type="checkbox"
                  id={`note-${note.id}`}
                  checked={selectedNotes.includes(note.id)}
                  onChange={() => toggleNote(note.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label
                  htmlFor={`note-${note.id}`}
                  className="flex-1 text-sm text-gray-700 cursor-pointer"
                >
                  {note.title}
                </label>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-sm text-gray-500">Нет доступных заметок</p>
            )}
          </div>
        </div>

        {/* Business Data */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Бизнес-данные
          </h3>
          <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm transition-colors">
            Добавить документ
          </button>
        </div>

        {/* Metadata Tables */}
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Используемые таблицы
          </h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
              users
            </div>
            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
              orders
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;