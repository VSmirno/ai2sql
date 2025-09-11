import React, { useState, useEffect } from 'react';
import { Shield, Users, Crown, Eye, Plus, Trash2, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { useProject } from '../contexts/ProjectContext';
import { ProjectMember } from '../types';
import toast from 'react-hot-toast';

const Admin = () => {
  const { user } = useAuth();
  const { allUsers, loadAllUsers } = useApp();
  const { 
    projects, 
    projectMembers,
    addProjectMember,
    updateMemberRole,
    removeMember,
    getProjectMembers
  } = useProject();

  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [newRole, setNewRole] = useState<ProjectMember['role']>('viewer');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<ProjectMember['role']>('viewer');

  // Load all users when component mounts
  useEffect(() => {
    if (isSuperuser) {
      loadAllUsers();
    }
  }, [isSuperuser, loadAllUsers]);

  // Check if user is superuser
  const isSuperuser = user?.role === 'superuser';

  if (!isSuperuser) {
    return (
      <div className="h-full bg-white flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Доступ запрещен
          </h2>
          <p className="text-gray-500">
            Только суперпользователи могут получить доступ к странице администрирования
          </p>
        </div>
      </div>
    );
  }

  const selectedUser = allUsers.find(u => u.id === selectedUserId);
  const userProjects = selectedUserId ? projectMembers.filter(m => m.userId === selectedUserId) : [];

  const handleAddUserToProject = async () => {
    if (!selectedUserId || !newProjectId) {
      toast.error('Выберите пользователя и проект');
      return;
    }

    // Check if user is already in the project
    const existingMember = projectMembers.find(m => 
      m.userId === selectedUserId && m.projectId === newProjectId
    );

    if (existingMember) {
      toast.error('Пользователь уже является участником этого проекта');
      return;
    }

    try {
      await addProjectMember(newProjectId, selectedUserId, newRole);
      setNewProjectId('');
      setNewRole('viewer');
      toast.success('Пользователь добавлен в проект');
    } catch (error) {
      toast.error('Ошибка при добавлении пользователя в проект');
    }
  };

  const handleUpdateRole = async (projectId: string, userId: string) => {
    try {
      await updateMemberRole(projectId, userId, editRole);
      setEditingMember(null);
      toast.success('Роль пользователя обновлена');
    } catch (error) {
      toast.error('Ошибка при обновлении роли');
    }
  };

  const handleRemoveFromProject = async (projectId: string, userId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить пользователя из проекта?')) {
      try {
        await removeMember(projectId, userId);
        toast.success('Пользователь удален из проекта');
      } catch (error) {
        toast.error('Ошибка при удалении пользователя из проекта');
      }
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

  const getAvailableProjects = () => {
    if (!selectedUserId) return projects;
    
    const userProjectIds = userProjects.map(up => up.projectId);
    return projects.filter(p => !userProjectIds.includes(p.id));
  };

  return (
    <div className="h-full bg-white">
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Администрирование</h1>
            <p className="text-gray-600">Управление пользователями и проектами</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* User Selection */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Выбор пользователя
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Пользователь
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Выберите пользователя --</option>
                  {allUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email}) - {user.role}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUser && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Информация о пользователе</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-medium">Имя:</span> {selectedUser.name}</p>
                    <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                    <p><span className="font-medium">Роль:</span> {selectedUser.role}</p>
                    <p><span className="font-medium">Проектов:</span> {userProjects.length}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User Projects */}
          {selectedUser && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Проекты пользователя: {selectedUser.name}
              </h2>

              {userProjects.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Пользователь не участвует ни в одном проекте
                </p>
              ) : (
                <div className="space-y-3">
                  {userProjects.map((member) => {
                    const project = projects.find(p => p.id === member.projectId);
                    if (!project) return null;

                    return (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold">
                              {project.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{project.name}</h3>
                            <p className="text-sm text-gray-500">{project.description || 'Без описания'}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {editingMember === member.id ? (
                            <div className="flex items-center space-x-2">
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value as ProjectMember['role'])}
                                className="text-sm border border-gray-300 rounded px-2 py-1"
                              >
                                <option value="viewer">Наблюдатель</option>
                                <option value="editor">Редактор</option>
                                <option value="admin">Администратор</option>
                              </select>
                              <button
                                onClick={() => handleUpdateRole(project.id, selectedUserId)}
                                className="text-green-600 hover:text-green-800 transition-colors"
                              >
                                <Save className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingMember(null)}
                                className="text-gray-600 hover:text-gray-800 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-2">
                                {getRoleIcon(member.role)}
                                <span className="text-sm text-gray-700">{getRoleLabel(member.role)}</span>
                              </div>
                              <button
                                onClick={() => {
                                  setEditingMember(member.id);
                                  setEditRole(member.role);
                                }}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveFromProject(project.id, selectedUserId)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Add User to Project */}
          {selectedUser && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Plus className="w-5 h-5 mr-2" />
                Добавить пользователя в проект
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Проект
                  </label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Выберите проект --</option>
                    {getAvailableProjects().map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Роль
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as ProjectMember['role'])}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="viewer">Наблюдатель</option>
                    <option value="editor">Редактор</option>
                    <option value="admin">Администратор</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={handleAddUserToProject}
                    disabled={!newProjectId}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Добавить</span>
                  </button>
                </div>
              </div>

              {getAvailableProjects().length === 0 && selectedUser && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 text-sm">
                    Пользователь уже участвует во всех доступных проектах
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{allUsers.length}</div>
                  <div className="text-sm text-gray-500">Всего пользователей</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{projects.length}</div>
                  <div className="text-sm text-gray-500">Всего проектов</div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Crown className="w-8 h-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <div className="text-2xl font-bold text-gray-900">{projectMembers.length}</div>
                  <div className="text-sm text-gray-500">Всего участников</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;