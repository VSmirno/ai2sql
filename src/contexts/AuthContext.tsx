import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // If user doesn't exist in our users table, create them
        if (error.code === 'PGRST116') {
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser.user) {
            const newUser: Omit<User, 'id'> = {
              email: authUser.user.email || '',
              name: authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'User',
              role: authUser.user.email === 'admin@example.com' ? 'superuser' : 'user',
              createdAt: new Date(),
              lastProjectId: null
            };

            const { data: createdUser, error: createError } = await supabase
              .from('users')
              .insert({ ...newUser, id: userId })
              .select()
              .single();

            if (createError) throw createError;
            
            setUser({
              id: createdUser.id,
              email: createdUser.email,
              name: createdUser.name,
              role: createdUser.role,
              createdAt: new Date(createdUser.created_at),
              lastProjectId: createdUser.last_project_id
            });
          }
        } else {
          throw error;
        }
      } else {
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role,
          createdAt: new Date(data.created_at),
          lastProjectId: data.last_project_id
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name
        }
      }
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}