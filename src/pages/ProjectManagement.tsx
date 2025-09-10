import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Users, Settings, Save, X, Crown, Shield, Eye } from 'lucide-react';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { Project, ProjectMember } from '../types';
import toast from 'react-hot-toast';

const ProjectManagement = () => {
  const { user } = useAuth();
  const { 
    projects, 
    currentProject, 
    projectMembers,
    createProject, 
    updateProject, 
    deleteProject,
    selectProject,
    addProjectMember,
    updateMemberRole,
    removeMember,
    getProjectMembers,
    getUserRole
  } = useProject();

  const [activeTab, setActiveTab] = useState<'projects' | 'members'>('projects');
  const [isCreating, setIsCreating] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // Mock users for member management
  const mockUsers = [
    { id: '2', name: 'Иван Петров', email: 'ivan@example.com', role: 'user' as const },
    { id: '3', name: 'Мария Сидорова', email: 'maria@example.com', role: 'user' as const },
    { id: '4', name: 'Алексей Козлов', email: 'alexey@example.com', role: 'admin' as const }
  ];

  const isSuperuser = user?.role === 'superuser';
  const canManageProjects = isSuperuser; // Только суперпользователь может управлять проектами

  console.log('User:', user?.email, 'Role:', user?.role, 'Is superuser:', isSuperuser);

  const handleCreateProject = () => {

    try {
      // Валидация на стороне клиента
      if (!formData.name.trim()) {
        toast.error('Название проекта обязательно для заполнения');
        return;
      }

      if (formData.name.trim().length < 3) {
        toast.error('Название проекта должно содержать минимум 3 символа');
        return;
      }

      if (formData.name.trim().length > 100) {
        toast.error('Название проекта не должно превышать 100 символов');
        return;
      }

      if (formData.description.trim().length > 500) {
        toast.error('Описание проекта не должно превышать 500 символов');
        return;
      }

      // Проверка уникальности названия
      const existingProject = projects.find(p => 
        p.name.toLowerCase().trim() === formData.name.toLowerCase().trim()
      );
      if (existingProject) {
        toast.error('Проект с таким названием уже существует');
        return;
      }

      createProject(formData.name.trim(), formData.description.trim() || undefined);
      setFormData({ name: '', description: '' });
      setIsCreating(false);
      toast.success('Проект успешно создан');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ошибка при создании проекта';
      toast.error(errorMessage);
    }
  };

  const handleUpdateProject = () => {
    if (!editingProject || !formData.name.trim()) {
      toast.error('Введите название проекта');
      return;
    }

    try {
      updateProject(editingProject, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });
      setFormData({ name: '', description: '' });
      setEditingProject(null);
      toast.success('Проект обновлен');
    } catch (error) {
      toast.error('Ошибка при обновлении проекта');
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот проект? Все данные будут потеряны.')) {
      deleteProject(projectId);
      toast.success('Проект удален');
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project.id);
    setFormData({
      name: project.name,
      description: project.description || ''
    });
    setIsCreating(false);
  };

  const handleCancelEdit = () => {
    setIsCreating(false);
    setEditingProject(null);
    setFormData({ name: '', description: '' });
  };

  const handleAddMember = (projectId: string, userId: string, role: ProjectMember['role']) => {
    try {
      addProjectMember(projectId, userId, role);
      toast.success('Участник добавлен в проект');
    } catch (error) {
      toast.error('Ошибка при добавлении участника');
    }
  };

  const handleUpdateMemberRole = (projectId: string, userId: string, role: ProjectMember['role']) => {
    try {
      updateMemberRole(projectId, userId, role);
      toast.success('Роль участника обновлена');
    } catch (error) {
      toast.error('Ошибка при обновлении роли');
    }
  };

  const handleRemoveMember = (projectId: string, userId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого участника из проекта?')) {
      removeMember(projectId, userId);
      toast.success('Участник удален из проекта');
    }
  };

  const getRoleIcon = (role: ProjectMember['role']) => {
    switch (role) {
      case 'admin': return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'editor': return <Shield className="w-4 h-4 text-blue-500" />;
      case 'viewer': return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: ProjectMember['role']) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'editor': return 'Редактор';
      case 'viewer': return 'Наблюдатель';
    }
  };

  if (!canManageProjects) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Доступ запрещен
          </h2>
          <p className="text-gray-500">
            Только суперпользователи могут управлять проектами
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Ваша роль: {user?.role === 'admin' ? 'Администратор' : 'Пользователь'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      <div className="border-b border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900">Управление проектами</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'projects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Проекты
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Участники проектов
            </button>
          </nav>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Create Project Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Список проектов</h2>
              <button
                onClick={() => {
                  setIsCreating(true);
                  setEditingProject(null);
                  setFormData({ name: '', description: '' });
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Создать проект</span>
              </button>
            </div>

            {/* Create/Edit Form */}
            {(isCreating || editingProject) && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {isCreating ? 'Новый проект' : 'Редактирование проекта'}
                  </h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={isCreating ? handleCreateProject : handleUpdateProject}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Название проекта * (3-100 символов)
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        formData.name.trim().length > 0 && formData.name.trim().length < 3
                          ? 'border-red-300 bg-red-50'
                          : formData.name.trim().length > 100
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      }`}
                      placeholder="Введите название проекта"
                      maxLength={100}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      {formData.name.length}/100 символов
                      {formData.name.trim().length > 0 && formData.name.trim().length < 3 && (
                        <span className="text-red-500 ml-2">Минимум 3 символа</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Описание (до 500 символов)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                        formData.description.length > 500
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-300'
                      }`}
                      rows={3}
                      placeholder="Описание проекта (необязательно)"
                      maxLength={500}
                    />
                    <div className="mt-1 text-xs text-gray-500">
                      {formData.description.length}/500 символов
                      {formData.description.length > 500 && (
                        <span className="text-red-500 ml-2">Превышен лимит символов</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Projects List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Проект
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Описание
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Участники
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Создан
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {projects.map((project) => {
                      const members = getProjectMembers(project.id);
                      const isCurrentProject = currentProject?.id === project.id;
                      
                      return (
                        <tr key={project.id} className={isCurrentProject ? 'bg-blue-50' : ''}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                                <span className="text-white text-sm font-bold">
                                  {project.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {project.name}
                                  {isCurrentProject && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Текущий
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {project.description || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {members.length} участник{members.length !== 1 ? (members.length < 5 ? 'а' : 'ов') : ''}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {project.createdAt.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              {!isCurrentProject && (
                                <button
                                  onClick={() => selectProject(project.id)}
                                  className="text-blue-600 hover:text-blue-900 transition-colors"
                                >
                                  Выбрать
                                </button>
                              )}
                              <button
                                onClick={() => handleEditProject(project)}
                                className="text-blue-600 hover:text-blue-900 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              {isSuperuser && (
                                <button
                                  onClick={() => handleDeleteProject(project.id)}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900">Управление участниками</h2>

            {projects.map((project) => {
              const members = getProjectMembers(project.id);
              
              return (
                <div key={project.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">{project.name}</h3>
                    <span className="text-sm text-gray-500">
                      {members.length} участник{members.length !== 1 ? (members.length < 5 ? 'а' : 'ов') : ''}
                    </span>
                  </div>

                  {/* Current Members */}
                  <div className="space-y-3 mb-4">
                    {members.map((member) => {
                      const memberUser = mockUsers.find(u => u.id === member.userId) || 
                        (member.userId === user?.id ? user : null);
                      
                      if (!memberUser) return null;

                      return (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-gray-600 text-sm font-medium">
                                {memberUser.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">{memberUser.name}</div>
                              <div className="text-xs text-gray-500">{memberUser.email}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(member.role)}
                              <span className="text-sm text-gray-700">{getRoleLabel(member.role)}</span>
                            </div>
                            
                            {isSuperuser && member.userId !== user?.id && (
                              <div className="flex space-x-1">
                                <select
                                  value={member.role}
                                  onChange={(e) => handleUpdateMemberRole(project.id, member.userId, e.target.value as ProjectMember['role'])}
                                  className="text-xs border border-gray-300 rounded px-2 py-1"
                                >
                                  <option value="viewer">Наблюдатель</option>
                                  <option value="editor">Редактор</option>
                                  <option value="admin">Администратор</option>
                                </select>
                                <button
                                  onClick={() => handleRemoveMember(project.id, member.userId)}
                                  className="text-red-600 hover:text-red-900 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Member */}
                  {isSuperuser && (
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Добавить участника</h4>
                      <div className="grid grid-cols-3 gap-3">
                        {mockUsers
                          .filter(mockUser => !members.some(member => member.userId === mockUser.id))
                          .map((mockUser) => (
                            <div key={mockUser.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{mockUser.name}</div>
                                <div className="text-xs text-gray-500">{mockUser.email}</div>
                              </div>
                              <select
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAddMember(project.id, mockUser.id, e.target.value as ProjectMember['role']);
                                    e.target.value = '';
                                  }
                                }}
                                className="text-xs border border-gray-300 rounded px-2 py-1"
                                defaultValue=""
                              >
                                <option value="">Добавить</option>
                                <option value="viewer">Наблюдатель</option>
                                <option value="editor">Редактор</option>
                                <option value="admin">Администратор</option>
                              </select>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManagement;