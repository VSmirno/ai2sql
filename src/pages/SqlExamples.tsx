import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Save, X, Upload, Download, Search } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import toast from 'react-hot-toast';

const SqlExamples = () => {
  const { sqlExamples, createSqlExample, updateSqlExample, deleteSqlExample } = useApp();
  const [activeTab, setActiveTab] = useState<'view' | 'search'>('view');
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    naturalLanguageQuery: '',
    sqlQuery: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(5);
  const [isSearching, setIsSearching] = useState(false);

  const handleCreateExample = () => {
    setIsCreating(true);
    setIsEditing(null);
    setFormData({ naturalLanguageQuery: '', sqlQuery: '' });
  };

  const handleEditExample = (id: string) => {
    const example = sqlExamples.find(e => e.id === id);
    if (example) {
      setIsEditing(id);
      setIsCreating(false);
      setFormData({
        naturalLanguageQuery: example.naturalLanguageQuery,
        sqlQuery: example.sqlQuery
      });
    }
  };

  const handleSaveExample = () => {
    if (!formData.naturalLanguageQuery.trim() || !formData.sqlQuery.trim()) {
      toast.error('Пожалуйста, заполните все поля');
      return;
    }

    if (isCreating) {
      createSqlExample(formData.naturalLanguageQuery.trim(), formData.sqlQuery.trim());
      toast.success('Пример запроса создан');
    } else if (isEditing) {
      updateSqlExample(isEditing, formData.naturalLanguageQuery.trim(), formData.sqlQuery.trim());
      toast.success('Пример запроса обновлен');
    }

    setIsCreating(false);
    setIsEditing(null);
    setFormData({ naturalLanguageQuery: '', sqlQuery: '' });
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setIsEditing(null);
    setFormData({ naturalLanguageQuery: '', sqlQuery: '' });
  };

  const handleDeleteExample = (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот пример?')) {
      deleteSqlExample(id);
      toast.success('Пример запроса удален');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('Введите запрос для поиска');
      return;
    }

    setIsSearching(true);
    try {
      // Simulate search
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success(`Найдено ${Math.floor(Math.random() * 5) + 1} похожих запросов`);
    } catch (error) {
      toast.error('Ошибка при поиске');
    } finally {
      setIsSearching(false);
    }
  };

  const handleExportToExcel = () => {
    // Simulate Excel export
    const csvContent = [
      ['Запрос на естественном языке', 'SQL-запрос'],
      ...sqlExamples.map(example => [example.naturalLanguageQuery, example.sqlQuery])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sql_examples.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Данные экспортированы в Excel');
  };

  const handleImportFromExcel = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls,.csv';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Simulate import
        toast.success(`Импортировано из файла: ${file.name}`);
      }
    };
    input.click();
  };

  return (
    <div className="h-full bg-white">
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Эталонные SQL-примеры</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('view')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'view'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Просмотр эталонных запросов
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Поиск похожих запросов
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* View Examples Tab */}
        {activeTab === 'view' && (
          <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-3">
                <button
                  onClick={handleCreateExample}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Создать новый пример</span>
                </button>
                <button
                  onClick={handleImportFromExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Импорт из Excel</span>
                </button>
                <button
                  onClick={handleExportToExcel}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Экспорт в Excel</span>
                </button>
              </div>
            </div>

            {/* Create/Edit Form */}
            {(isCreating || isEditing) && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {isCreating ? 'Новый пример' : 'Редактирование примера'}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveExample}
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

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Запрос на естественном языке
                    </label>
                    <textarea
                      value={formData.naturalLanguageQuery}
                      onChange={(e) => setFormData(prev => ({ ...prev, naturalLanguageQuery: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                      rows={4}
                      placeholder="Опишите запрос на естественном языке"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SQL-запрос
                    </label>
                    <textarea
                      value={formData.sqlQuery}
                      onChange={(e) => setFormData(prev => ({ ...prev, sqlQuery: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-mono text-sm"
                      rows={4}
                      placeholder="SELECT * FROM table WHERE condition;"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Examples Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-12 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        №
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Запрос на естественном языке
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SQL-запрос
                      </th>
                      <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sqlExamples.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                          Нет примеров SQL-запросов. Создайте первый пример.
                        </td>
                      </tr>
                    ) : (
                      sqlExamples.map((example, index) => (
                        <tr key={example.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="max-w-md">
                              <p className="whitespace-pre-wrap">{example.naturalLanguageQuery}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            <div className="max-w-md">
                              <pre className="whitespace-pre-wrap font-mono text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">
                                {example.sqlQuery}
                              </pre>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditExample(example.id)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExample(example.id)}
                                className="text-red-600 hover:text-red-900 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Search Similar Tab */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Введите запрос на естественном языке
                  </label>
                  <textarea
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={3}
                    placeholder="Найти всех пользователей с активным статусом..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Количество результатов: {searchResults}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={searchResults}
                    onChange={(e) => setSearchResults(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1</span>
                    <span>10</span>
                  </div>
                </div>

                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Поиск...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Найти похожие запросы</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Search Results */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Результаты поиска</h3>
              
              <div className="space-y-4">
                {/* Mock search results */}
                {[1, 2, 3].map((result) => (
                  <div key={result} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div>
                          <span className="text-sm text-gray-500">Запрос:</span>
                          <p className="text-sm text-gray-900">
                            Найти всех активных пользователей, зарегистрированных в этом месяце
                          </p>
                        </div>
                        <div>
                          <span className="text-sm text-gray-500">SQL:</span>
                          <pre className="text-xs bg-gray-900 text-green-400 p-2 rounded mt-1 overflow-x-auto">
{`SELECT * FROM users 
WHERE status = 'active' 
AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE);`}
                          </pre>
                        </div>
                      </div>
                      <div className="ml-4 text-sm text-gray-500">
                        Схожесть: {(95 - result * 5)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SqlExamples;