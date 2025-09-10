import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, ProjectMember } from '../types';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  projectMembers: ProjectMember[];
  userProjects: Project[];
  
  // Project management
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  selectProject: (projectId: string) => void;
  
  // Member management
  addProjectMember: (projectId: string, userId: string, role: ProjectMember['role']) => Promise<void>;
  updateMemberRole: (projectId: string, userId: string, role: ProjectMember['role']) => Promise<void>;
  removeMember: (projectId: string, userId: string) => Promise<void>;
  getProjectMembers: (projectId: string) => ProjectMember[];
  canUserAccessProject: (projectId: string, userId: string) => boolean;
  getUserRole: (projectId: string, userId: string) => ProjectMember['role'] | null;
  
  isLoading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load projects when user changes
  useEffect(() => {
    if (user) {
      loadProjects();
      loadProjectMembers();
    } else {
      setProjects([]);
      setCurrentProject(null);
      setProjectMembers([]);
    }
  }, [user]);

  const loadProjects = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Создаем дефолтный проект для пользователя
      const defaultProject: Project = {
        id: 'default-project',
        name: 'Мой проект',
        description: 'Основной проект пользователя',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.id,
        connectionId: undefined
      };

      setProjects([defaultProject]);
      setCurrentProject(defaultProject);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectMembers = async () => {
    if (!user) return;

    // Создаем дефолтного участника проекта
    const defaultMember: ProjectMember = {
      id: 'default-member',
      projectId: 'default-project',
      userId: user.id,
      role: 'admin',
      addedAt: new Date(),
      addedBy: user.id
    };

    setProjectMembers([defaultMember]);
  };

  const canUserAccessProject = (projectId: string, userId: string): boolean => {
    if (!userId) return false;
    
    // Superuser has access to all projects
    if (user?.role === 'superuser') return true;
    
    // Все пользователи имеют доступ к дефолтному проекту
    return projectId === 'default-project' || userId === user?.id;
  };

  const getUserRole = (projectId: string, userId: string): ProjectMember['role'] | null => {
    if (projectId === 'default-project') {
      return user?.role === 'superuser' ? 'admin' : 'editor';
    }
    return 'editor';
  };

  const userProjects = projects.filter(project => 
    canUserAccessProject(project.id, user?.id || '')
  );

  const createProject = async (name: string, description?: string): Promise<Project> => {
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }

    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: name.trim(),
      description: description?.trim() || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.id,
      connectionId: undefined
    };

    setProjects(prev => [newProject, ...prev]);
    
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
    ));
  };

  const deleteProject = async (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));

    if (currentProject?.id === id) {
      setCurrentProject(null);
    }
  };

  const selectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project && canUserAccessProject(projectId, user?.id || '')) {
      setCurrentProject(project);
    }
  };

  const addProjectMember = async (projectId: string, userId: string, role: ProjectMember['role']) => {
    if (!user) return;

    const newMember: ProjectMember = {
      id: `member-${Date.now()}`,
      projectId,
      userId,
      role,
      addedAt: new Date(),
      addedBy: user.id
    };

    setProjectMembers(prev => [...prev, newMember]);
  };

  const updateMemberRole = async (projectId: string, userId: string, role: ProjectMember['role']) => {
    setProjectMembers(prev => prev.map(m => 
      m.projectId === projectId && m.userId === userId 
        ? { ...m, role }
        : m
    ));
  };

  const removeMember = async (projectId: string, userId: string) => {
    setProjectMembers(prev => prev.filter(m => 
      !(m.projectId === projectId && m.userId === userId)
    ));
  };

  const getProjectMembers = (projectId: string): ProjectMember[] => {
    return projectMembers.filter(member => member.projectId === projectId);
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      currentProject,
      projectMembers,
      userProjects,
      createProject,
      updateProject,
      deleteProject,
      selectProject,
      addProjectMember,
      updateMemberRole,
      removeMember,
      getProjectMembers,
      canUserAccessProject,
      getUserRole,
      isLoading
    }}>
      {children}
    </ProjectContext.Provider>
  );
}