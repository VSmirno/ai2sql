import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
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

  // Mock users for development
  const mockUsers = [
    {
      id: 'admin-user-id',
      email: 'admin@example.com',
      name: 'Администратор',
      role: 'superuser' as const,
      password: 'asdfasdf'
    }
  ];

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
    // Check for mock user first
    const mockUser = mockUsers.find(u => u.email === email && u.password === password);
    if (mockUser) {
      // Simulate successful login for mock user
      setUser({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        createdAt: new Date(),
        lastProjectId: null
      });
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
    } catch (error) {
      throw error;
    }
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
    // Handle mock user logout
    if (user?.id === 'admin-user-id') {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      throw error;
    }
  };

  // Compatibility methods for existing components
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      await signIn(email, password);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      await signUp(email, password, name);
      return true;
    } catch (error) {
      console.error('Register error:', error);
      return false;
    }
  };

  const logout = () => {
    signOut();
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}