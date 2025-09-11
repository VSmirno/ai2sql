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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUserToUser(session.user));
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUserToUser(session.user));
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
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateLastProject, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}