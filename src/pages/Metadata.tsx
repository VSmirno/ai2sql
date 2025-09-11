import React, { useState } from 'react';
import { Database, Eye, EyeOff, RefreshCw, Trash2, Plus, Check, X } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useProject } from '../contexts/ProjectContext';
import toast from 'react-hot-toast';

const Metadata = () => {
  const { 
    connections, 
    createConnection, 
    updateConnection, 
    deleteConnection
  } = useApp();
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<'connections' | 'view' | 'extraction'>('connections');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [connectionData, setConnectionData] = useState({
    name: '',
    host: '',
    port: 5432,
    username: '',
    password: '',
    database: ''
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'error' | null>(null);
  const [selectedTable, setSelectedTable] = useState('');
  const [extractionMode, setExtractionMode] = useState<'selective' | 'all'>('selective');
  const [tablesToExtract, setTablesToExtract] = useState('');

  // Get the project's connection
  const projectConnection = connections.find(c => c.id === currentProject?.connectionId);

  const handleSaveConnection = async () => {
    if (!connectionData.name || !connectionData.host || !connectionData.username || !connectionData.database) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    try {
      if (isCreating) {
        await createConnection(connectionData);
        toast.success('Подключение создано успешно');
        setIsCreating(false);
      } else if (projectConnection) {
        await updateConnection(projectConnection.id, connectionData);
        toast.success('Подключение обновлено успешно');
        setIsEditing(false);
      }

      setConnectionData({
        name: '',
        host: '',
        port: 5432,
        username: '',
        password: '',
        database: ''
      });
    } catch (error) {
      toast.error('Ошибка при сохранении подключения');
    }
  };

  const handleDeleteConnection = () => {
    if (projectConnection && window.confirm('Вы уверены, что хотите удалить это подключение?')) {
      deleteConnection(projectConnection.id);
      toast.success('Подключение удалено');
    }
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);

    try {
      // Simulate connection test
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Random success/failure for demo
      const success = Math.random() > 0.3;
      setConnectionTestResult(success ? 'success' : 'error');
      
      if (success) {
        toast.success('Подключение установлено успешно');
      } else {
        toast.error('Не удалось подключиться к базе данных');
      }
    } catch (error) {
      setConnectionTestResult('error');
      toast.error('Ошибка при тестировании подключения');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setIsEditing(false);
    setConnectionData({
      name: '',
      host: '',
      port: 5432,
      username: '',
      password: '',
      database: ''
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setIsCreating(false);
    if (projectConnection) {
      setConnectionData({
        name: projectConnection.name,
        host: projectConnection.host,
        port: projectConnection.port,
        username: projectConnection.username,
        password: projectConnection.password,
        database: projectConnection.database
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setIsCreating(false);
    if (projectConnection) {
      setConnectionData({
        name: projectConnection.name,
        host: projectConnection.host,
        port: projectConnection.port,
        username: projectConnection.username,
        password: projectConnection.password,
        database: projectConnection.database
      });
    } else {
      setConnectionData({
        name: '',
        host: '',
        port: 5432,
        username: '',
        password: '',
        database: ''
      });
    }
  };

  const mockTables = ['users', 'orders', 'products', 'categories', 'order_items'];
  const mockSchemas = [
    {
      name: 'public',
      tables: ['users', 'orders', 'products']
    },
    {
      name: 'analytics',
      tables: ['user_stats', 'sales_reports']
    }
  ];

  const mockTableDetails = {
    users: [
      { name: 'id', type: 'uuid', nullable: false, isPrimaryKey: true, isForeignKey: false },
      { name: 'email', type: 'varchar(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
      { name: 'name', type: 'varchar(255)', nullable: false, isPrimaryKey: false, isForeignKey: false },
      { name: 'created_at', type: 'timestamp', nullable: false, isPrimaryKey: false, isForeignKey: false },
      { name: 'status', type: 'varchar(50)', nullable: false, isPrimaryKey: false, isForeignKey: false }
    ]
  };

  return (
    <div className="h-full bg-white">
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Управление метаданными</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { key: 'connections', label: 'Управление подключениями' },
              { key: 'view', label: 'Просмотр метаданных' },
              { key: 'extraction', label: 'Извлечение метаданных' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className="space-y-6">
            {!currentProject ? (
              <div className="text-center py-8">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Выберите проект
                </h3>
                <p className="text-gray-500">
                  Для управления подключениями необходимо выбрать проект
                </p>
              </div>
            ) : !projectConnection && !isCreating ? (
              <div className="text-center py-8">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Нет подключения к базе данных
                </h3>
                <p className="text-gray-500 mb-6">
                  В проекте "{currentProject.name}" не настроено подключение к базе данных
                </p>
                <button
                  onClick={handleCreateNew}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Создать подключение</span>
                </button>
              </div>
            ) : (
              <>
                {/* Project Connection Info */}
                {projectConnection && !isCreating && !isEditing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-blue-900">
                          Подключение проекта: {currentProject.name}
                        </h3>
                        <p className="text-blue-700 text-sm">
                          {projectConnection.name} ({projectConnection.host}:{projectConnection.port})
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleEdit}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Редактировать
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Form */}
                {(isCreating || isEditing) && (
                  <div className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        {isCreating ? 'Новое подключение' : 'Редактирование подключения'}
                      </h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleSaveConnection}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <Check className="w-4 h-4" />
                          <span>Сохранить подключение</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
                        >
                          <X className="w-4 h-4" />
                          <span>Отмена</span>
                        </button>
                        {projectConnection && !isCreating && (
                          <button
                            onClick={handleDeleteConnection}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Удалить</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Название подключения *
                        </label>
                        <input
                          type="text"
                          value={connectionData.name}
                          onChange={(e) => setConnectionData(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Мое подключение"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Хост *
                        </label>
                        <input
                          type="text"
                          value={connectionData.host}
                          onChange={(e) => setConnectionData(prev => ({ ...prev, host: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="localhost"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Порт
                        </label>
                        <input
                          type="number"
                          value={connectionData.port}
                          onChange={(e) => setConnectionData(prev => ({ ...prev, port: parseInt(e.target.value) || 5432 }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Пользователь *
                        </label>
                        <input
                          type="text"
                          value={connectionData.username}
                          onChange={(e) => setConnectionData(prev => ({ ...prev, username: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="username"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Пароль *
                        </label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={connectionData.password}
                            onChange={(e) => setConnectionData(prev => ({ ...prev, password: e.target.value }))}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Имя базы данных *
                        </label>
                        <input
                          type="text"
                          value={connectionData.database}
                          onChange={(e) => setConnectionData(prev => ({ ...prev, database: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="my_database"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Connection Test */}
                {projectConnection && !isCreating && !isEditing && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Тестирование подключения</h3>
                    <button
                      onClick={handleTestConnection}
                      disabled={isTestingConnection}
                      className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors flex items-center space-x-2"
                    >
                      {isTestingConnection ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Database className="w-4 h-4" />
                      )}
                      <span>
                        {isTestingConnection ? 'Проверка...' : 'Проверить подключение'}
                      </span>
                    </button>

                    {connectionTestResult && (
                      <div className={`mt-3 p-3 rounded-lg ${
                        connectionTestResult === 'success' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {connectionTestResult === 'success' 
                          ? '✓ Подключение к базе данных установлено успешно'
                          : '✗ Не удалось подключиться к базе данных. Проверьте настройки подключения.'
                        }
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* View Metadata Tab */}
        {activeTab === 'view' && (
          <div className="space-y-6">
            {!currentProject ? (
              <div className="text-center py-8">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Выберите проект
                </h3>
                <p className="text-gray-500">
                  Для просмотра метаданных необходимо выбрать проект
                </p>
              </div>
            ) : !projectConnection ? (
              <div className="text-center py-8">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Нет подключения к базе данных
                </h3>
                <p className="text-gray-500 mb-6">
                  Для просмотра метаданных необходимо настроить подключение к базе данных
                </div>
                <button
                  onClick={() => setActiveTab('connections')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Настроить подключение</span>
                </button>
              </div>
            ) : (
              <>
                <div className="flex space-x-4">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4" />
                    <span>Обновить метаданные</span>
                  </button>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
                    <Trash2 className="w-4 h-4" />
                    <span>Очистить все метаданные</span>
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Выбор таблицы
                  </label>
                  <select
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Выберите таблицу --</option>
                    {mockTables.map((table) => (
                      <option key={table} value={table}>
                        {table}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTable && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4">
                      <h3 className="text-lg font-medium text-gray-900">{selectedTable}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Колонка
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Тип
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nullable
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Primary Key
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Foreign Key
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(mockTableDetails[selectedTable as keyof typeof mockTableDetails] || []).map((column) => (
                            <tr key={column.name}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {column.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {column.type}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {column.nullable ? 'Yes' : 'No'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {column.isPrimaryKey ? '✓' : ''}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {column.isForeignKey ? '✓' : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Extraction Tab */}
        {activeTab === 'extraction' && (
          <div className="space-y-6">
            {!currentProject ? (
              <div className="text-center py-8">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Выберите проект
                </h3>
                <p className="text-gray-500">
                  Для извлечения метаданных необходимо выбрать проект
                </p>
              </div>
            ) : !projectConnection ? (
              <div className="text-center py-8">
                <Database className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Нет подключения к базе данных
                </h3>
                <p className="text-gray-500 mb-6">
                  Для извлечения метаданных необходимо настроить подключение к базе данных
                </p>
                <button
                  onClick={() => setActiveTab('connections')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Настроить подключение</span>
                </button>
              </div>
            ) : (
              <>
                {/* Connection Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-blue-900">
                    Подключение: {projectConnection.name}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    {projectConnection.host}:{projectConnection.port} / {projectConnection.database}
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg">
                  <div className="border-b border-gray-200">
                    <nav className="flex">
                      <button
                        onClick={() => setExtractionMode('selective')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 ${
                          extractionMode === 'selective'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Выборочное извлечение
                      </button>
                      <button
                        onClick={() => setExtractionMode('all')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 ${
                          extractionMode === 'all'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Извлечение всех страниц
                      </button>
                    </nav>
                  </div>

                  <div className="p-6">
                    {extractionMode === 'selective' && (
                      <div className="grid grid-cols-2 gap-6">
                        {/* Schema List */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Схемы и таблицы</h4>
                          <div className="space-y-3">
                            {mockSchemas.map((schema) => (
                              <div key={schema.name} className="border border-gray-200 rounded-lg p-3">
                                <div className="font-medium text-gray-900 mb-2">{schema.name}</div>
                                <div className="space-y-1">
                                  {schema.tables.map((table) => (
                                    <div key={table} className="text-sm text-gray-600 pl-2">
                                      {table}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Selected Tables */}
                        <div>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Выбранные таблицы</h4>
                            <div className="mb-4">
                              <label className="block text-sm text-gray-700 mb-2">
                                Таблицы для извлечения (schema.table)
                              </label>
                              <textarea
                                value={tablesToExtract}
                                onChange={(e) => setTablesToExtract(e.target.value)}
                                rows={6}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder={`public.users\npublic.orders\nanalytics.user_stats`}
                              />
                            </div>
                            <div className="flex space-x-3">
                              <button
                                onClick={() => setTablesToExtract('')}
                                className="text-sm text-gray-500 hover:text-gray-700"
                              >
                                Очистить поле
                              </button>
                            </div>
                          </div>

                          <button className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                            Извлечь данные
                          </button>
                        </div>
                      </div>
                    )}

                    {extractionMode === 'all' && (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">Извлечь все метаданные из выбранной базы данных</p>
                        <button className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                          Извлечь все метаданные
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Metadata;