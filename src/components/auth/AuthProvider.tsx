'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthUser, SignupForm, AuthContextType } from '@/types';
import { 
  authStorage, 
  UserManager, 
  PasswordManager, 
  loginSchema, 
  signupSchema,
  generateToken,
  initializeApp
} from '@/lib/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize app and check for existing session
    initializeApp();
    const savedUser = authStorage.getUser();
    if (savedUser) {
      setUser(savedUser);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);

      // Validate input
      const validatedData = loginSchema.parse({ email, password });

      // Find user
      const foundUser = UserManager.findByEmail(validatedData.email);
      if (!foundUser) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      if (!PasswordManager.verifyUserPassword(foundUser.id, validatedData.password)) {
        throw new Error('Invalid email or password');
      }

      // Generate token and create auth user
      const token = generateToken(foundUser);
      const authUser: AuthUser = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        role: foundUser.role,
        token,
      };

      // Save to storage and update state
      authStorage.setToken(token);
      setUser(authUser);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupForm): Promise<boolean> => {
    try {
      setLoading(true);

      // Validate input
      const validatedData = signupSchema.parse(data);

      // Check if user already exists
      const existingUser = UserManager.findByEmail(validatedData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Create new user
      const newUser = UserManager.addUser(validatedData);
      PasswordManager.savePassword(newUser.id, validatedData.password);

      // Auto-login the new user
      const token = generateToken(newUser);
      const authUser: AuthUser = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        token,
      };

      // Save to storage and update state
      authStorage.setToken(token);
      setUser(authUser);

      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authStorage.removeToken();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    signup,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}