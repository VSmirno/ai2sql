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

  // Auto-select project based on lastProjectId
  useEffect(() => {
    if (user && projects.length > 0 && projectMembers.length > 0 && !currentProject) {
      let projectToSelect: Project | null = null;

      // Try to select last project if it exists and user has access
      if (user.lastProjectId) {
        const lastProject = projects.find(p => p.id === user.lastProjectId);
        if (lastProject && canUserAccessProject(lastProject.id, user.id)) {
          projectToSelect = lastProject;
          console.log('Selected last project for user:', user.email, 'project:', lastProject.name);
        }
      }

      // If no last project or no access, select first available project
      if (!projectToSelect) {
        projectToSelect = projects.find(p => canUserAccessProject(p.id, user.id)) || null;
        if (projectToSelect) {
          console.log('Selected first available project for user:', user.email, 'project:', projectToSelect.name);
        }
      }

      if (projectToSelect) {
        setCurrentProject(projectToSelect);
      } else {
        console.log('No accessible projects found for user:', user.email);
      }
    }
  }, [user, projects, projectMembers, currentProject]);

  const loadProjects = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedProjects = data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
        createdBy: p.created_by,
        connectionId: p.connection_id
      }));

      setProjects(mappedProjects);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProjectMembers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('project_members')
        .select('*');

      if (error) throw error;

      const mappedMembers = data.map(m => ({
        id: m.id,
        projectId: m.project_id,
        userId: m.user_id,
        role: m.role as ProjectMember['role'],
        addedAt: new Date(m.added_at),
        addedBy: m.added_by
      }));

      setProjectMembers(mappedMembers);
    } catch (error) {
      console.error('Error loading project members:', error);
    }
  };

  const canUserAccessProject = (projectId: string, userId: string): boolean => {
    if (!userId) return false;
    
    // Check if user is superuser by email (since role might not be loaded yet)
    const isSuperuser = user?.role === 'superuser' || 
      ['admin@ai.ru', 'admin@example.com'].includes(user?.email || '');
    
    if (isSuperuser) {
      console.log('Superuser access granted for project:', projectId, 'user:', user?.email);
      return true;
    }
    
    // Check if user is a member of the project
    const isMember = projectMembers.some(member => 
      member.projectId === projectId && member.userId === userId
    );
    
    console.log('Member access check for project:', projectId, 'user:', user?.email, 'isMember:', isMember);
    return isMember;
  };

  const getUserRole = (projectId: string, userId: string): ProjectMember['role'] | null => {
    const member = projectMembers.find(m => 
      m.projectId === projectId && m.userId === userId
    );
    return member?.role || null;
  };

  const userProjects = projects.filter(project => 
    canUserAccessProject(project.id, user?.id || '')
  );

  const createProject = async (name: string, description?: string): Promise<Project> => {
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }

    // Check if user is superuser by email (since we don't have users table data yet)
    const isSuperuser = ['admin@ai.ru', 'admin@example.com'].includes(user.email || '');
    if (!isSuperuser) {
      throw new Error('Только суперпользователи могут создавать проекты');
    }

    // Validate name uniqueness
    const existingProject = projects.find(p => 
      p.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (existingProject) {
      throw new Error('Проект с таким названием уже существует');
    }

    try {
      // Insert into database and wait for response
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: name.trim(),
          description: description?.trim() || null,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw new Error('Ошибка при создании проекта в базе данных');
      }

      const newProject: Project = {
        id: data.id,
        name: data.name,
        description: data.description,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        createdBy: data.created_by,
        connectionId: data.connection_id
      };

      setProjects(prev => [newProject, ...prev]);
      return newProject;
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
          description: updates.description
        })
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.map(p => 
        p.id === id ? { ...p, ...updates, updatedAt: new Date() } : p
      ));

      if (currentProject?.id === id) {
        setCurrentProject(prev => prev ? { ...prev, ...updates } : null);
      }
    } catch (error) {
      console.error('Error updating project:', error);
      throw error;
    }
  };

  const deleteProject = async (id: string) => {
    // Don't try to delete temporary IDs
    if (id.startsWith('temp-')) {
      setProjects(prev => prev.filter(p => p.id !== id));
      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== id));

      if (currentProject?.id === id) {
        setCurrentProject(null);
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      throw error;
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

    try {
      const { data, error } = await supabase
        .from('project_members')
        .insert({
          project_id: projectId,
          user_id: userId,
          role: role,
          added_by: user.id
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

      setProjectMembers(prev => prev.map(m => 
        m.projectId === projectId && m.userId === userId 
          ? { ...m, role }
          : m
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

      setProjectMembers(prev => prev.filter(m => 
        !(m.projectId === projectId && m.userId === userId)
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
      getUserRole,
      isLoading
    }}>
      {children}
    </ProjectContext.Provider>
  );
}