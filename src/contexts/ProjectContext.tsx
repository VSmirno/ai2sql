import React, { createContext, useContext, useState, useEffect } from 'react';
import { Project, ProjectMember } from '../types';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

interface ProjectContextType {
  projects: Project[];
  currentProject: Project | null;
  projectMembers: ProjectMember[];
  userProjects: Project[];
  
  // Project management
  createProject: (name: string, description?: string) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  selectProject: (projectId: string) => void;
  
  // Member management
  addProjectMember: (projectId: string, userId: string, role: ProjectMember['role']) => void;
  updateMemberRole: (projectId: string, userId: string, role: ProjectMember['role']) => void;
  removeMember: (projectId: string, userId: string) => void;
  getProjectMembers: (projectId: string) => ProjectMember[];
  canUserAccessProject: (projectId: string, userId: string) => boolean;
  getUserRole: (projectId: string, userId: string) => ProjectMember['role'] | null;
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

  // Initialize with mock data
  useEffect(() => {
    if (user) {
      const mockProject: Project = {
        id: uuidv4(),
        name: 'Основной проект',
        description: 'Проект для работы с основной базой данных',
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: user.id
      };

      const mockMember: ProjectMember = {
        id: uuidv4(),
        projectId: mockProject.id,
        userId: user.id,
        role: 'admin',
        addedAt: new Date(),
        addedBy: user.id
      };

      setProjects([mockProject]);
      setProjectMembers([mockMember]);
      
      // Select last project or first available
      const lastProjectId = user.lastProjectId;
      if (lastProjectId && lastProjectId === mockProject.id) {
        setCurrentProject(mockProject);
      } else {
        setCurrentProject(mockProject);
      }
    }
  }, [user]);

  const canUserAccessProject = (projectId: string, userId: string): boolean => {
    if (!userId) return false;
    
    // Superuser has access to all projects
    if (user?.role === 'superuser') return true;
    
    // Check if user is a member of the project
    return projectMembers.some(member => 
      member.projectId === projectId && member.userId === userId
    );
  };

  const getUserRole = (projectId: string, userId: string): ProjectMember['role'] | null => {
    const member = projectMembers.find(member => 
      member.projectId === projectId && member.userId === userId
    );
    return member?.role || null;
  };

  const userProjects = projects.filter(project => 
    canUserAccessProject(project.id, user?.id || '')
  );

  const createProject = (name: string, description?: string): Project => {
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }

    // Проверка прав доступа - только суперпользователь может создавать проекты
    if (user.role !== 'superuser') {
      throw new Error('Недостаточно прав для создания проекта');
    }

    // Проверка уникальности названия проекта
    const existingProject = projects.find(p => 
      p.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (existingProject) {
      throw new Error('Проект с таким названием уже существует');
    }

    // Валидация данных
    if (!name || name.trim().length === 0) {
      throw new Error('Название проекта обязательно для заполнения');
    }

    if (name.trim().length < 3) {
      throw new Error('Название проекта должно содержать минимум 3 символа');
    }

    if (name.trim().length > 100) {
      throw new Error('Название проекта не должно превышать 100 символов');
    }

    if (description && description.trim().length > 500) {
      throw new Error('Описание проекта не должно превышать 500 символов');
    }

    const newProject: Project = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim() || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user.id
    };

    const newMember: ProjectMember = {
      id: uuidv4(),
      projectId: newProject.id,
      userId: user.id,
      role: 'admin',
      addedAt: new Date(),
      addedBy: user.id
    };

    setProjects(prev => [...prev, newProject]);
    setProjectMembers(prev => [...prev, newMember]);
    
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(project => 
      project.id === id 
        ? { ...project, ...updates, updatedAt: new Date() }
        : project
    ));

    if (currentProject?.id === id) {
      setCurrentProject(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(project => project.id !== id));
    setProjectMembers(prev => prev.filter(member => member.projectId !== id));
    
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

  const addProjectMember = (projectId: string, userId: string, role: ProjectMember['role']) => {
    const newMember: ProjectMember = {
      id: uuidv4(),
      projectId,
      userId,
      role,
      addedAt: new Date(),
      addedBy: user?.id || ''
    };

    setProjectMembers(prev => [...prev, newMember]);
  };

  const updateMemberRole = (projectId: string, userId: string, role: ProjectMember['role']) => {
    setProjectMembers(prev => prev.map(member => 
      member.projectId === projectId && member.userId === userId
        ? { ...member, role }
        : member
    ));
  };

  const removeMember = (projectId: string, userId: string) => {
    setProjectMembers(prev => prev.filter(member => 
      !(member.projectId === projectId && member.userId === userId)
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
      getUserRole
    }}>
      {children}
    </ProjectContext.Provider>
  );
}