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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading projects:', error);
        return;
      }

      const projectsData = data.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
        createdBy: p.created_by,
        connectionId: p.connection_id
      }));

      setProjects(projectsData);

      // Select last project or first available
      if (user.lastProjectId) {
        const lastProject = projectsData.find(p => p.id === user.lastProjectId);
        if (lastProject && canUserAccessProject(lastProject.id, user.id)) {
          setCurrentProject(lastProject);
        }
      } else if (projectsData.length > 0) {
        const firstAccessibleProject = projectsData.find(p => canUserAccessProject(p.id, user.id));
        if (firstAccessibleProject) {
          setCurrentProject(firstAccessibleProject);
        }
      }
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

      if (error) {
        console.error('Error loading project members:', error);
        return;
      }

      const membersData = data.map(m => ({
        id: m.id,
        projectId: m.project_id,
        userId: m.user_id,
        role: m.role,
        addedAt: new Date(m.added_at),
        addedBy: m.added_by
      }));

      setProjectMembers(membersData);
    } catch (error) {
      console.error('Error loading project members:', error);
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

  const createProject = async (name: string, description?: string): Promise<Project> => {
    if (!user) {
      throw new Error('Пользователь не авторизован');
    }

    if (user.role !== 'superuser') {
      throw new Error('Недостаточно прав для создания проекта');
    }

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
      throw new Error(error.message);
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

    // Add creator as admin
    await supabase
      .from('project_members')
      .insert({
        project_id: newProject.id,
        user_id: user.id,
        role: 'admin',
        added_by: user.id
      });

    await loadProjects();
    await loadProjectMembers();
    
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const { error } = await supabase
      .from('projects')
      .update({
        name: updates.name,
        description: updates.description
      })
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    await loadProjects();
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }

    if (currentProject?.id === id) {
      setCurrentProject(null);
    }

    await loadProjects();
    await loadProjectMembers();
  };

  const selectProject = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project && canUserAccessProject(projectId, user?.id || '')) {
      setCurrentProject(project);
    }
  };

  const addProjectMember = async (projectId: string, userId: string, role: ProjectMember['role']) => {
    if (!user) return;

    const { error } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: userId,
        role,
        added_by: user.id
      });

    if (error) {
      throw new Error(error.message);
    }

    await loadProjectMembers();
  };

  const updateMemberRole = async (projectId: string, userId: string, role: ProjectMember['role']) => {
    const { error } = await supabase
      .from('project_members')
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    await loadProjectMembers();
  };

  const removeMember = async (projectId: string, userId: string) => {
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(error.message);
    }

    await loadProjectMembers();
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