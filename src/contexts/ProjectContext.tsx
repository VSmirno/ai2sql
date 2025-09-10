import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
    if (user?.id) {
      loadUserProjects();
    }
  }, [user?.id]);

  const loadUserProjects = async () => {
    if (!user?.id) return;

    try {
      // Load projects where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('project_members')
        .select(`
          *,
          projects (*)
        `)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Load all projects if superuser
      let allProjectsData = [];
      if (user.role === 'superuser') {
        const { data: allProjects, error: allProjectsError } = await supabase
          .from('projects')
          .select('*');

        if (allProjectsError) throw allProjectsError;
        allProjectsData = allProjects || [];
      }

      // Combine and deduplicate projects
      const memberProjects = memberData?.map(m => m.projects).filter(Boolean) || [];
      const uniqueProjects = new Map();
      
      [...memberProjects, ...allProjectsData].forEach(project => {
        if (project) {
          uniqueProjects.set(project.id, {
            id: project.id,
            name: project.name,
            description: project.description,
            createdAt: new Date(project.created_at),
            updatedAt: new Date(project.updated_at),
            createdBy: project.created_by,
            connectionId: project.connection_id
          });
        }
      });

      const projectsList = Array.from(uniqueProjects.values());
      setProjects(projectsList);

      // Set project members
      const members = memberData?.map(m => ({
        id: m.id,
        projectId: m.project_id,
        userId: m.user_id,
        role: m.role,
        addedAt: new Date(m.added_at),
        addedBy: m.added_by
      })) || [];
      setProjectMembers(members);

      // Select first available project
      if (projectsList.length > 0) {
        setCurrentProject(projectsList[0]);
      }
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

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
    if (!user?.id) {
      throw new Error('Пользователь не авторизован');
    }

    // Проверка прав доступа - только суперпользователь может создавать проекты
    if (user.role !== 'superuser') {
      throw new Error('Недостаточно прав для создания проекта');
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

    // Проверка уникальности названия проекта в локальном состоянии
    const existingProject = projects.find(p => 
      p.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (existingProject) {
      throw new Error('Проект с таким названием уже существует');
    }

    const newProject: Project = {
      id: uuidv4(),
      name: name.trim(),
      description: description?.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: user?.id || '',
      connectionId: undefined
    };

    const newMember: ProjectMember = {
      id: uuidv4(),
      projectId: newProject.id,
      userId: user?.id || '',
      role: 'admin',
      addedAt: new Date(),
      addedBy: user?.id || ''
    };

    setProjects(prev => [...prev, newProject]);
    setProjectMembers(prev => [...prev, newMember]);
    
    return newProject;
  };

  const createProjectAsync = async (name: string, description?: string): Promise<Project> => {
      if (!user) {
        throw new Error('Пользователь не авторизован');
      }

      // Проверка прав доступа - только суперпользователь может создавать проекты
      if (user.role !== 'superuser') {
        throw new Error('Недостаточно прав для создания проекта');
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

      try {
        // Проверка уникальности названия проекта в локальном состоянии
        const existingProject = projects.find(p => 
          p.name.toLowerCase().trim() === name.toLowerCase().trim()
        );
        if (existingProject) {
          throw new Error('Проект с таким названием уже существует');
        }

        // Создаем проект локально (без базы данных)
        return createProject(name, description);
      } catch (error) {
        console.error('Error creating project:', error);
        throw error;
      }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          name: updates.name,
          description: updates.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(project => 
        project.id === id 
          ? { ...project, ...updates, updatedAt: new Date() }
          : project
      ));

      if (currentProject?.id === id) {
        setCurrentProject(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(project => project.id !== id));
      setProjectMembers(prev => prev.filter(member => member.projectId !== id));
      
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
    }
  };

  const selectProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project && canUserAccessProject(projectId, user?.id || '')) {
      setCurrentProject(project);
      
      // Update user's last project
      if (user?.id) {
        try {
          await supabase
            .from('users')
            .update({ last_project_id: projectId })
            .eq('id', user.id);
        } catch (error) {
          console.error('Error updating last project:', error);
        }
      }
    }
  };

  const addProjectMember = async (projectId: string, userId: string, role: ProjectMember['role']) => {
    try {
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userId,
          role,
          added_by: user?.id || ''
        })
        .select()
        .single();

      if (error) throw error;

      const newMember: ProjectMember = {
        id: data.id,
        projectId: data.project_id,
        userId: data.user_id,
        role: data.role,
        addedAt: new Date(data.added_at),
        addedBy: data.added_by
      };

      setProjectMembers(prev => [...prev, newMember]);
    } catch (error) {
      console.error('Error adding project member:', error);
      throw error;
    }
  };

  const updateMemberRole = async (projectId: string, userId: string, role: ProjectMember['role']) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ role })
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) throw error;

      setProjectMembers(prev => prev.map(member => 
        member.projectId === projectId && member.userId === userId
          ? { ...member, role }
          : member
      ));
    } catch (error) {
      console.error('Error updating member role:', error);
      throw error;
    }
  };

  const removeMember = async (projectId: string, userId: string) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', userId);

      if (error) throw error;

      setProjectMembers(prev => prev.filter(member => 
        !(member.projectId === projectId && member.userId === userId)
      ));
    } catch (error) {
      console.error('Error removing member:', error);
      throw error;
    }
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