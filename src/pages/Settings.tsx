import React, { useState } from 'react';
import { Save, X, Plus, Minus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import toast from 'react-hot-toast';

const Settings = () => {
  const { settings, updateSettings } = useApp();
  const [formData, setFormData] = useState(settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleInputChange = (key: keyof typeof settings, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings(formData);
    setHasChanges(false);
    toast.success('Настройки сохранены');
  };

  const handleCancel = () => {
    setFormData(settings);
    setHasChanges(false);
  };

  const incrementRagExamples = () => {
    const newValue = Math.min(formData.ragExamplesCount + 1, 10);
    handleInputChange('ragExamplesCount', newValue);
  };

  const decrementRagExamples = () => {
    const newValue = Math.max(formData.ragExamplesCount - 1, 1);
    handleInputChange('ragExamplesCount', newValue);
  };

  return (
    <div className="h-full bg-white">
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Настройки</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            <button className="py-4 px-1 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
              Общие настройки
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl space-y-6">
          {/* App Settings Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Настройки приложения</h3>
            
            <div className="space-y-6">
              {/* RAG Examples Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Количество RAG-примеров
                </label>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={decrementRagExamples}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
                    disabled={formData.ragExamplesCount <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.ragExamplesCount}
                    onChange={(e) => handleInputChange('ragExamplesCount', parseInt(e.target.value) || 1)}
                    className="w-20 text-center border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={incrementRagExamples}
                    className="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
                    disabled={formData.ragExamplesCount >= 10}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  От 1 до 10 примеров для контекстной генерации
                </p>
              </div>

              {/* Debug Mode */}
              <div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="debugMode"
                    checked={formData.debugMode}
                    onChange={(e) => handleInputChange('debugMode', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="debugMode" className="text-sm font-medium text-gray-700">
                    Режим отладки
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1 ml-7">
                  Показывать дополнительную отладочную информацию в интерфейсе
                </p>
              </div>

              {/* RAG Similarity Threshold */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Порог схожести RAG: {formData.ragSimilarityThreshold.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={formData.ragSimilarityThreshold}
                  onChange={(e) => handleInputChange('ragSimilarityThreshold', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.00</span>
                  <span>1.00</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Минимальный уровень схожести для включения примеров в контекст
                </p>
              </div>
            </div>
          </div>

          {/* Save/Cancel Buttons */}
          {hasChanges && (
            <div className="flex space-x-3">
              <button
                onClick={handleSave}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Сохранить изменения</span>
              </button>
              <button
                onClick={handleCancel}
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <X className="w-4 h-4" />
                <span>Отменить изменения</span>
              </button>
            </div>
          )}

          {/* Additional Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">i</span>
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-800">О настройках</h4>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      <strong>RAG-примеры:</strong> Количество примеров, которые система использует для улучшения генерации SQL
                    </li>
                    <li>
                      <strong>Режим отладки:</strong> Показывает дополнительную техническую информацию
                    </li>
                    <li>
                      <strong>Порог схожести:</strong> Определяет, насколько релевантным должен быть пример для включения в контекст
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;