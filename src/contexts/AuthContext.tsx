import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
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

  const fetchUserProfile = async (authUser: SupabaseUser): Promise<User> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to mapped user if database fetch fails
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
      console.error('Error in fetchUserProfile:', error);
      return mapSupabaseUserToUser(authUser);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user);
        setUser(userProfile);
      } else {
        setUser(null);
      }
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
      lastProjectId: null
    };
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
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
        const userProfile = await fetchUserProfile(data.user);
        setUser(userProfile);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    console.log('🚀 AuthContext register function called');
    console.log('Registration params:', { email, name, passwordLength: password.length });
    
    setIsLoading(true);
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
        console.log('👤 User created in auth, waiting for trigger to create profile...');
        // The handle_new_user trigger will automatically create the user profile
        // The onAuthStateChange listener will handle setting the user state
        console.log('🎯 User state updated, registration complete');
        return true;
      }

      console.log('❌ No user data returned from Supabase');
      return false;
    } catch (error) {
      console.error('Registration error:', error);
      console.log('💥 Unexpected error during registration:', error);
      return false;
    } finally {
      setIsLoading(false);
      console.log('🏁 Registration process finished, loading state reset');
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}