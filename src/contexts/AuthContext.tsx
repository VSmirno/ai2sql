import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, initializeDatabase } from '../lib/supabase';

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin' | 'superuser';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Compatibility methods
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  logout: () => void;
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
    // Initialize database
    initializeDatabase();
    
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserFromAuth(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUserFromAuth(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const setUserFromAuth = (authUser: any) => {
    // Determine role based on email or metadata
    let role: 'user' | 'admin' | 'superuser' = 'user';
    
    if (authUser.email === 'admin@example.com') {
      role = 'superuser';
    } else if (authUser.user_metadata?.role) {
      role = authUser.user_metadata.role;
    }
    
    setUser({
      id: authUser.id,
      email: authUser.email || '',
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Пользователь',
      avatar: authUser.user_metadata?.avatar_url,
      role
    });
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
      isLoading: loading,
      signIn,
      signUp,
      signOut,
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}