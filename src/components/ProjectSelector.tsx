import React, { useState } from 'react';
import { ChevronDown, Plus, Settings, Users } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProjectSelector = () => {
  const { user } = useAuth();
  const { 
    currentProject, 
    userProjects, 
    selectProject, 
    createProject,
    getUserRole 
  } = useProject();
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const handleSelectProject = (projectId: string) => {
    selectProject(projectId);
    setIsOpen(false);
    toast.success('Проект выбран');
  };

  const handleCreateProject = async () => {

    try {
      // Валидация на стороне клиента
      if (!newProjectName.trim()) {
        toast.error('Название проекта обязательно для заполнения');
        return;
      }

      if (newProjectName.trim().length < 3) {
        toast.error('Название проекта должно содержать минимум 3 символа');
        return;
      }

      if (newProjectName.trim().length > 100) {
        toast.error('Название проекта не должно превышать 100 символов');
        return;
      }

      if (newProjectDescription.trim().length > 500) {
        toast.error('Описание проекта не должно превышать 500 символов');
        return;
      }

      const project = await createProject(newProjectName.trim(), newProjectDescription.trim() || undefined);
      selectProject(project.id);
      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateForm(false);
      setIsOpen(false);
      toast.success('Проект успешно создан');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при создании проекта';
      toast.error(errorMessage);
    }
  };

  // Check if user is superuser by email
  const canCreateProjects = ['admin@ai.ru', 'admin@example.com'].includes(user?.email || '');

  console.log('User role:', user?.role, 'Can create projects:', canCreateProjects);

  if (!currentProject) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 text-sm">Выберите проект для работы</p>
        {canCreateProjects && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm underline"
          >
            Создать новый проект
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">
              {currentProject.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="text-left">
            <div className="text-white font-medium text-sm">{currentProject.name}</div>
            <div className="text-gray-400 text-xs">
              {getUserRole(currentProject.id, user?.id || '') || 'member'}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs text-gray-400 uppercase tracking-wider px-2 py-1 mb-2">
              Доступные проекты
            </div>
            
            {userProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleSelectProject(project.id)}
                className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left hover:bg-gray-700 transition-colors ${
                  currentProject.id === project.id ? 'bg-gray-700' : ''
                }`}
              >
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {project.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="text-white text-sm">{project.name}</div>
                  <div className="text-gray-400 text-xs">
                    {getUserRole(project.id, user?.id || '') || 'member'}
                  </div>
                </div>
              </button>
            ))}

            {canCreateProjects && (
              <>
                <div className="border-t border-gray-700 my-2"></div>
                
                {!showCreateForm ? (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="w-full flex items-center space-x-3 p-2 rounded-lg text-left hover:bg-gray-700 transition-colors text-blue-400"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm">Создать новый проект</span>
                  </button>
                ) : (
                  <div className="p-2 space-y-3">
                    <input
                      type="text"
                      placeholder="Название проекта (3-100 символов)"
                      value={newProjectName}
                      onChange={(e) => setNewProjectName(e.target.value)}
                      className={`w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                        newProjectName.trim().length > 0 && newProjectName.trim().length < 3
                          ? 'ring-2 ring-red-500'
                          : newProjectName.length > 100
                          ? 'ring-2 ring-red-500'
                          : ''
                      }`}
                      maxLength={100}
                      autoFocus
                    />
                    <textarea
                      placeholder="Описание (до 500 символов, необязательно)"
                      value={newProjectDescription}
                      onChange={(e) => setNewProjectDescription(e.target.value)}
                      className={`w-full bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none ${
                        newProjectDescription.length > 500
                          ? 'ring-2 ring-red-500'
                          : ''
                      }`}
                      rows={2}
                      maxLength={500}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleCreateProject}
                        disabled={
                          !newProjectName.trim() ||
                          newProjectName.trim().length < 3 ||
                          newProjectName.length > 100 ||
                          newProjectDescription.length > 500
                        }
                        className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        Создать
                      </button>
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewProjectName('');
                          setNewProjectDescription('');
                        }}
                        className="flex-1 bg-gray-600 hover:bg-gray-500 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                      >
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectSelector;