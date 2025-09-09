import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Save, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { UserNote } from '../types';
import toast from 'react-hot-toast';

const Notes = () => {
  const { notes, createNote, updateNote, deleteNote } = useApp();
  const [selectedNote, setSelectedNote] = useState<UserNote | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });

  const handleCreateNote = () => {
    setIsCreating(true);
    setIsEditing(false);
    setSelectedNote(null);
    setFormData({ title: '', content: '' });
  };

  const handleEditNote = (note: UserNote) => {
    setIsEditing(true);
    setIsCreating(false);
    setSelectedNote(note);
    setFormData({ title: note.title, content: note.content });
  };

  const handleSaveNote = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Пожалуйста, заполните все поля');
      return;
    }

    if (isCreating) {
      const newNote = createNote(formData.title.trim(), formData.content.trim());
      setSelectedNote(newNote);
      toast.success('Заметка создана');
    } else if (selectedNote) {
      updateNote(selectedNote.id, formData.title.trim(), formData.content.trim());
      setSelectedNote({ ...selectedNote, title: formData.title.trim(), content: formData.content.trim() });
      toast.success('Заметка обновлена');
    }

    setIsCreating(false);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setIsEditing(false);
    if (selectedNote) {
      setFormData({ title: selectedNote.title, content: selectedNote.content });
    } else {
      setFormData({ title: '', content: '' });
    }
  };

  const handleDeleteNote = (note: UserNote) => {
    if (window.confirm('Вы уверены, что хотите удалить эту заметку?')) {
      deleteNote(note.id);
      if (selectedNote?.id === note.id) {
        setSelectedNote(null);
        setFormData({ title: '', content: '' });
      }
      toast.success('Заметка удалена');
    }
  };

  const handleSelectNote = (note: UserNote) => {
    setSelectedNote(note);
    setFormData({ title: note.title, content: note.content });
    setIsCreating(false);
    setIsEditing(false);
  };

  return (
    <div className="h-full bg-white flex">
      {/* Notes List */}
      <div className="w-1/3 border-r border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Заметки</h1>
            <button
              onClick={handleCreateNote}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Новая заметка</span>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notes.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p>У вас пока нет заметок</p>
              <p className="text-sm">Создайте первую заметку для начала работы</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => handleSelectNote(note)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedNote?.id === note.id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <h3 className="font-medium text-gray-900 truncate mb-1">
                    {note.title}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                    {note.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {note.createdAt.toLocaleDateString()}
                    </span>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditNote(note);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNote(note);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Note Details */}
      <div className="flex-1 flex flex-col">
        {(isCreating || isEditing) ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isCreating ? 'Новая заметка' : 'Редактирование заметки'}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handleSaveNote}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>Сохранить</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Отменить</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Заголовок
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Введите заголовок заметки"
                />
              </div>

              <div className="flex-1 flex flex-col">
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Содержание
                </label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  className="flex-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  placeholder="Введите содержание заметки"
                />
              </div>
            </div>
          </div>
        ) : selectedNote ? (
          <div className="flex flex-col h-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedNote.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Создано: {selectedNote.createdAt.toLocaleString()}
                  </p>
                  {selectedNote.updatedAt.getTime() !== selectedNote.createdAt.getTime() && (
                    <p className="text-sm text-gray-500">
                      Обновлено: {selectedNote.updatedAt.toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditNote(selectedNote)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Редактировать</span>
                  </button>
                  <button
                    onClick={() => handleDeleteNote(selectedNote)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Удалить</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-gray-700 font-sans leading-relaxed">
                  {selectedNote.content}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <p className="text-lg mb-2">Выберите заметку для просмотра</p>
              <p className="text-sm">или создайте новую заметку</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notes;