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

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Fetch user data from public.users table to get last_project_id
        const { data: userData, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (userData && !error) {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            avatar: userData.avatar,
            role: userData.role as 'user' | 'admin' | 'superuser',
            lastProjectId: userData.last_project_id
          });
        } else {
          // If no user data in public.users, create basic user object
          const basicUser = mapSupabaseUserToUser(session.user);
          setUser(basicUser);
              } else {
        setUser(null);
      }
      }
      setIsLoading(false);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const mapSupabaseUserToUser = (authUser: SupabaseUser): User => {
    // Определяем роль пользователя
    let role: 'user' | 'admin' | 'superuser' = 'user';
    
    // Если это admin@ai.ru или admin@example.com - делаем суперпользователем
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

      if (data.user) {
        setUser(mapSupabaseUserToUser(data.user));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    console.log('🚀 AuthContext register function called');
    console.log('Registration params:', { email, name, passwordLength: password.length });
    
    try {
      console.log('📡 Calling supabase.auth.signUp...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      console.log('📨 Supabase signUp response:', { data: data?.user?.id, error });

      if (error) {
        console.error('Registration error:', error);
        console.log('❌ Supabase registration error:', error.message);
        return false;
      }

      if (data.user) {
        console.log('👤 User created in auth, now inserting into public.users...');
        // Determine the role for the new user based on email
        const newUserRole = mapSupabaseUserToUser(data.user).role;
        console.log('🔑 Determined user role:', newUserRole);

        // Explicitly insert user data into the public.users table
        console.log('💾 Inserting user into public.users table...');
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            name: name, // Use the name provided during registration
            role: newUserRole // Use the determined role
          }, {
            onConflict: 'id'
          });

        console.log('📊 Public users upsert result:', { upsertError });

        if (upsertError) {
          console.error('Error upserting user into public.users:', upsertError);
          console.log('❌ Failed to upsert into public.users:', upsertError.message);
          return false; // If insertion into public.users fails, consider registration unsuccessful
        }
        
        console.log('✅ User successfully upserted into public.users');
        setUser(mapSupabaseUserToUser(data.user));
        console.log('🎯 User state updated, registration complete');
        return true;
      }

      console.log('❌ No user data returned from Supabase');
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      console.log('💥 Unexpected error during registration:', error);
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