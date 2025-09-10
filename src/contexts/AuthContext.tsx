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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserData(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (authUser: SupabaseUser) => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.error('Error loading user data:', error);
        setUser(null);
      } else {
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar,
          role: userData.role,
          lastProjectId: userData.last_project_id
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log('Attempting login for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // If login fails with invalid credentials and it's the admin user, try to create it
        if (error.message === 'Invalid login credentials' && email === 'admin@ai.ru') {
          console.log('Admin user not found, attempting to create...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: 'Admin User'
              }
            }
          });

          if (signUpError) {
            console.error('Failed to create admin user:', signUpError);
            return false;
          }

          if (signUpData.user) {
            // Update the user role to superuser in the users table
            const { error: updateError } = await supabase
              .from('users')
              .update({ role: 'superuser' })
              .eq('id', signUpData.user.id);

            if (updateError) {
              console.error('Failed to update user role:', updateError);
            }

            console.log('Admin user created successfully');
            await loadUserData(signUpData.user);
            return true;
          }
        }

        console.error('Supabase auth error:', error);
        console.error('Error message:', error.message);
        console.error('Error status:', error.status);
        return false;
      }

      if (data.user) {
        console.log('Login successful for user:', data.user.id);
        await loadUserData(data.user);
        return true;
      }

      console.log('Login failed: No user data returned');
      return false;
    } catch (error) {
      console.error('Network/Connection error:', error);
      console.error('This usually means:');
      console.error('1. Supabase URL or API key is incorrect');
      console.error('2. Network connectivity issues');
      console.error('3. Supabase project is paused or deleted');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true);
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
        // User will be created in users table by trigger
        return true;
      }

      return false;
    } catch (error) {
      console.error('Registration error:', error);
      return false;
    } finally {
      setIsLoading(false);
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