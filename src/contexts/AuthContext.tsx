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

      // Select last project or first available
      if (user.lastProjectId && projectsList.find(p => p.id === user.lastProjectId)) {
        const lastProject = projectsList.find(p => p.id === user.lastProjectId);
        if (lastProject) setCurrentProject(lastProject);
      } else if (projectsList.length > 0) {
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
    return new Promise(async (resolve, reject) => {
      if (!user) {
        reject(new Error('Пользователь не авторизован'));
        return;
      }

      // Проверка прав доступа - только суперпользователь может создавать проекты
      if (user.role !== 'superuser') {
        reject(new Error('Недостаточно прав для создания проекта'));
        return;
      }

      // Валидация данных
      if (!name || name.trim().length === 0) {
        reject(new Error('Название проекта обязательно для заполнения'));
        return;
      }

      if (name.trim().length < 3) {
        reject(new Error('Название проекта должно содержать минимум 3 символа'));
        return;
      }

      if (name.trim().length > 100) {
        reject(new Error('Название проекта не должно превышать 100 символов'));
        return;
      }

      if (description && description.trim().length > 500) {
        reject(new Error('Описание проекта не должно превышать 500 символов'));
        return;
      }

      try {
        // Проверка уникальности названия проекта
        const { data: existingProject } = await supabase
          .from('projects')
          .select('id')
          .ilike('name', name.trim())
          .single();

        if (existingProject) {
          reject(new Error('Проект с таким названием уже существует'));
          return;
        }

        // Создание проекта
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .insert({
            name: name.trim(),
            description: description?.trim() || null,
            created_by: user.id
          })
          .select()
          .single();

        if (projectError) throw projectError;

        // Добавление создателя как администратора проекта
        const { error: memberError } = await supabase
          .from('project_members')
          .insert({
            project_id: projectData.id,
            user_id: user.id,
            role: 'admin',
            added_by: user.id
          });

        if (memberError) throw memberError;

        const newProject: Project = {
          id: projectData.id,
          name: projectData.name,
          description: projectData.description,
          createdAt: new Date(projectData.created_at),
          updatedAt: new Date(projectData.updated_at),
          createdBy: projectData.created_by,
          connectionId: projectData.connection_id
        };

        const newMember: ProjectMember = {
          id: uuidv4(),
          projectId: projectData.id,
          userId: user.id,
          role: 'admin',
          addedAt: new Date(),
          addedBy: user.id
        };

        setProjects(prev => [...prev, newProject]);
        setProjectMembers(prev => [...prev, newMember]);
        
        resolve(newProject);
      } catch (error) {
        console.error('Error creating project:', error);
        reject(error);
      }
    });
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