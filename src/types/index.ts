// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  token: string;
}

// Data record types
export interface DataRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  value: number;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface SignupForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface DataForm {
  title: string;
  description: string;
  category: string;
  value: number;
  status: 'active' | 'inactive';
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  message: string;
  error?: string;
}

// Context types
export interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupForm) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

// Data context types
export interface DataContextType {
  records: DataRecord[];
  loading: boolean;
  addRecord: (data: DataForm) => Promise<boolean>;
  updateRecord: (id: string, data: Partial<DataForm>) => Promise<boolean>;
  deleteRecord: (id: string) => Promise<boolean>;
  refreshRecords: () => Promise<void>;
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  totalRecords: number;
  activeRecords: number;
  inactiveRecords: number;
}

// Excel export/import types
export interface ExcelExportOptions {
  includeInactive?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  categories?: string[];
}

export interface ExcelImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  duplicates: number;
}

// Utility types
export type UserRole = 'admin' | 'user';
export type RecordStatus = 'active' | 'inactive';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  key: keyof DataRecord;
  direction: SortOrder;
}

export interface FilterConfig {
  category?: string;
  status?: RecordStatus;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}