import { User, AuthUser, SignupForm } from '@/types';
import { z } from 'zod';

// Validation schemas
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Simple token generation (in production, use proper JWT)
export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  };
  return btoa(JSON.stringify(payload));
}

// Token validation
export function validateToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token));
    
    if (payload.exp < Date.now()) {
      return null; // Token expired
    }
    
    return {
      id: payload.id,
      email: payload.email,
      name: payload.name || '',
      role: payload.role,
      token,
    };
  } catch {
    return null;
  }
}

// Password hashing (simple implementation - use bcrypt in production)
export function hashPassword(password: string): string {
  return btoa(password + 'salt_key_2024');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Local storage helpers
export const authStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },
  
  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  },
  
  removeToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  },
  
  getUser(): AuthUser | null {
    const token = this.getToken();
    return token ? validateToken(token) : null;
  }
};

// User data management
export class UserManager {
  private static USERS_KEY = 'saas_users';
  
  static getUsers(): User[] {
    if (typeof window === 'undefined') return [];
    const users = localStorage.getItem(this.USERS_KEY);
    return users ? JSON.parse(users) : [];
  }
  
  static saveUsers(users: User[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }
  
  static addUser(userData: SignupForm): User {
    const users = this.getUsers();
    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      role: users.length === 0 ? 'admin' : 'user', // First user is admin
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }
  
  static findByEmail(email: string): User | null {
    const users = this.getUsers();
    return users.find(user => user.email === email) || null;
  }
  
  static updateUser(id: string, updates: Partial<User>): boolean {
    const users = this.getUsers();
    const index = users.findIndex(user => user.id === id);
    
    if (index === -1) return false;
    
    users[index] = { ...users[index], ...updates, updatedAt: new Date() };
    this.saveUsers(users);
    return true;
  }
  
  static deleteUser(id: string): boolean {
    const users = this.getUsers();
    const filteredUsers = users.filter(user => user.id !== id);
    
    if (filteredUsers.length === users.length) return false;
    
    this.saveUsers(filteredUsers);
    return true;
  }
}

// Password data management (separate from user data for security)
export class PasswordManager {
  private static PASSWORDS_KEY = 'saas_passwords';
  
  static getPasswords(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    const passwords = localStorage.getItem(this.PASSWORDS_KEY);
    return passwords ? JSON.parse(passwords) : {};
  }
  
  static savePassword(userId: string, password: string): void {
    if (typeof window === 'undefined') return;
    const passwords = this.getPasswords();
    passwords[userId] = hashPassword(password);
    localStorage.setItem(this.PASSWORDS_KEY, JSON.stringify(passwords));
  }
  
  static verifyUserPassword(userId: string, password: string): boolean {
    const passwords = this.getPasswords();
    const storedHash = passwords[userId];
    return storedHash ? verifyPassword(password, storedHash) : false;
  }
  
  static deletePassword(userId: string): void {
    const passwords = this.getPasswords();
    delete passwords[userId];
    localStorage.setItem(this.PASSWORDS_KEY, JSON.stringify(passwords));
  }
}

// Role-based access control
export function hasAdminAccess(user: AuthUser | null): boolean {
  return user?.role === 'admin';
}

export function hasUserAccess(user: AuthUser | null, resourceUserId?: string): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (resourceUserId) return user.id === resourceUserId;
  return true;
}

export function requireAuth(user: AuthUser | null): boolean {
  return user !== null;
}

// Initialize default admin user if no users exist
export function initializeApp(): void {
  const users = UserManager.getUsers();
  if (users.length === 0) {
    const adminData: SignupForm = {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      confirmPassword: 'admin123',
    };
    const admin = UserManager.addUser(adminData);
    PasswordManager.savePassword(admin.id, adminData.password);
    console.log('Default admin user created - email: admin@example.com, password: admin123');
  }
}