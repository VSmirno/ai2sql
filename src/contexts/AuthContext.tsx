import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
  updateLastProject: (projectId: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserData = async (authUser: SupabaseUser): Promise<User> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error loading user data:', error);
        return mapSupabaseUserToUser(authUser);
      }

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        avatar: data.avatar,
        role: data.role as 'user' | 'admin' | 'superuser',
        lastProjectId: data.last_project_id
      };
    } catch (error) {
      console.error('Error loading user data:', error);
      return mapSupabaseUserToUser(authUser);
    }
  };

  const mapSupabaseUserToUser = (authUser: SupabaseUser): User => {
    let role: 'user' | 'admin' | 'superuser' = 'user';
    
    if (authUser.email === 'admin@ai.ru' || authUser.email === 'admin@example.com') {
      role = 'superuser';
    }
    
    return {
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
      avatar: authUser.user_metadata?.avatar_url || null,
      role: role,
      lastProjectId: authUser.user_metadata?.last_project_id || null
    };
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userData = await loadUserData(session.user);
        setUser(userData);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userData = await loadUserData(session.user);
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Login error:', error);
        return false;
      }

      return !!data.user;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        return false;
      }

      if (data.user) {
        // Determine the role for the new user based on email
        let role: 'user' | 'admin' | 'superuser' = 'user';
        if (email === 'admin@ai.ru' || email === 'admin@example.com') {
          role = 'superuser';
        }

        // Insert user data into the public.users table
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            name: name,
            role: role
          }, {
            onConflict: 'id'
          });

        if (upsertError) {
          console.error('Error upserting user into public.users:', upsertError);
          return false;
        }
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    }
  };

  const updateLastProject = async (projectId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ last_project_id: projectId })
        .eq('id', user.id);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, lastProjectId: projectId } : null);
    } catch (error) {
      console.error('Error updating last project:', error);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Check if the error is about session not found, which is not critical
      if (error?.message?.includes('Session from session_id claim in JWT does not exist')) {
        console.warn('Session already expired on server, but client logout successful');
      } else {
        console.error('Logout error:', error);
      }
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateLastProject, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}