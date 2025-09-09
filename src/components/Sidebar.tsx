import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Database, 
  StickyNote, 
  FileText, 
  Settings, 
  LogOut,
  Plus,
  MoreHorizontal,
  Edit3,
  Trash2,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { chats, currentChat, createChat, selectChat, deleteChat, renameChat } = useApp();
  const navigate = useNavigate();
  const [showAllChats, setShowAllChats] = useState(false);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newChatName, setNewChatName] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Вы успешно вышли из системы');
  };

  const handleCreateNewChat = () => {
    const chat = createChat('Новый чат');
    selectChat(chat.id);
    navigate('/');
  };

  const handleRenameChat = (chatId: string, currentName: string) => {
    setEditingChatId(chatId);
    setNewChatName(currentName);
  };

  const handleSaveRename = () => {
    if (editingChatId && newChatName.trim()) {
      renameChat(editingChatId, newChatName.trim());
      setEditingChatId(null);
      setNewChatName('');
    }
  };

  const handleCancelRename = () => {
    setEditingChatId(null);
    setNewChatName('');
  };

  const handleDeleteChat = (chatId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот чат?')) {
      deleteChat(chatId);
      if (currentChat?.id === chatId) {
        navigate('/');
      }
    }
  };

  const filteredChats = showAllChats ? chats : chats.filter(chat => chat.userId === user?.id);

  return (
    <div className="w-64 bg-gray-900 text-white flex flex-col">
      {/* User Profile */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          {user?.avatar ? (
            <img 
              src={user.avatar} 
              alt={user.name}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="font-medium text-sm">{user?.name}</div>
            <div className="text-xs text-gray-400">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* New Chat Button */}
      <div className="p-4">
        <button
          onClick={handleCreateNewChat}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Новый чат</span>
        </button>
      </div>

      {/* Chat Filter */}
      <div className="px-4 mb-2">
        <button
          onClick={() => setShowAllChats(!showAllChats)}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          {showAllChats ? 'Показать только мои чаты' : 'Показать все чаты'}
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 space-y-1">
        {filteredChats.map((chat) => (
          <div
            key={chat.id}
            className={`group relative flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-gray-800 ${
              currentChat?.id === chat.id ? 'bg-gray-800' : ''
            }`}
          >
            {editingChatId === chat.id ? (
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveRename()}
                  onBlur={handleSaveRename}
                  autoFocus
                />
              </div>
            ) : (
              <>
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div 
                  className="flex-1 text-sm truncate"
                  onClick={() => {
                    selectChat(chat.id);
                    navigate('/');
                  }}
                >
                  {chat.name}
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                  <button
                    onClick={() => handleRenameChat(chat.id, chat.name)}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteChat(chat.id)}
                    className="p-1 hover:bg-gray-700 rounded text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="p-4 space-y-1 border-t border-gray-700">
        <NavLink
          to="/metadata"
          className={({ isActive }) =>
            `flex items-center space-x-3 p-2 rounded-lg transition-colors ${
              isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`
          }
        >
          <Database className="w-4 h-4" />
          <span>Метаданные</span>
        </NavLink>
        
        <NavLink
          to="/notes"
          className={({ isActive }) =>
            `flex items-center space-x-3 p-2 rounded-lg transition-colors ${
              isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`
          }
        >
          <StickyNote className="w-4 h-4" />
          <span>Заметки</span>
        </NavLink>
        
        <NavLink
          to="/sql-examples"
          className={({ isActive }) =>
            `flex items-center space-x-3 p-2 rounded-lg transition-colors ${
              isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`
          }
        >
          <FileText className="w-4 h-4" />
          <span>SQL-примеры</span>
        </NavLink>
        
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center space-x-3 p-2 rounded-lg transition-colors ${
              isActive ? 'bg-gray-800 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-800'
            }`
          }
        >
          <Settings className="w-4 h-4" />
          <span>Настройки</span>
        </NavLink>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Выход</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;