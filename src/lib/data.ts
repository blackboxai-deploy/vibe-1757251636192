import { DataRecord, DataForm, SortConfig, FilterConfig } from '@/types';
import { z } from 'zod';

// Validation schema for data records
export const dataSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long'),
  category: z.string().min(1, 'Category is required'),
  value: z.number().min(0, 'Value must be positive'),
  status: z.enum(['active', 'inactive']),
});

// Data storage management
export class DataManager {
  private static RECORDS_KEY = 'saas_data_records';
  
  static getRecords(): DataRecord[] {
    if (typeof window === 'undefined') return [];
    const records = localStorage.getItem(this.RECORDS_KEY);
    return records ? JSON.parse(records).map((record: any) => ({
      ...record,
      createdAt: new Date(record.createdAt),
      updatedAt: new Date(record.updatedAt),
    })) : [];
  }
  
  static saveRecords(records: DataRecord[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.RECORDS_KEY, JSON.stringify(records));
  }
  
  static addRecord(userId: string, data: DataForm): DataRecord {
    const records = this.getRecords();
    const newRecord: DataRecord = {
      id: Date.now().toString(),
      userId,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    records.push(newRecord);
    this.saveRecords(records);
    return newRecord;
  }
  
  static updateRecord(id: string, updates: Partial<DataForm>): boolean {
    const records = this.getRecords();
    const index = records.findIndex(record => record.id === id);
    
    if (index === -1) return false;
    
    records[index] = { 
      ...records[index], 
      ...updates, 
      updatedAt: new Date() 
    };
    this.saveRecords(records);
    return true;
  }
  
  static deleteRecord(id: string): boolean {
    const records = this.getRecords();
    const filteredRecords = records.filter(record => record.id !== id);
    
    if (filteredRecords.length === records.length) return false;
    
    this.saveRecords(filteredRecords);
    return true;
  }
  
  static getRecordsByUserId(userId: string): DataRecord[] {
    return this.getRecords().filter(record => record.userId === userId);
  }
  
  static getRecordById(id: string): DataRecord | null {
    return this.getRecords().find(record => record.id === id) || null;
  }
  
  static getUserRecordCount(userId: string): number {
    return this.getRecordsByUserId(userId).length;
  }
}

// Data filtering and sorting utilities
export class DataUtils {
  static sortRecords(records: DataRecord[], config: SortConfig): DataRecord[] {
    return [...records].sort((a, b) => {
      const aVal = a[config.key];
      const bVal = b[config.key];
      
      let comparison = 0;
      if (aVal < bVal) comparison = -1;
      if (aVal > bVal) comparison = 1;
      
      return config.direction === 'desc' ? -comparison : comparison;
    });
  }
  
  static filterRecords(records: DataRecord[], filter: FilterConfig): DataRecord[] {
    return records.filter(record => {
      // Category filter
      if (filter.category && record.category !== filter.category) {
        return false;
      }
      
      // Status filter
      if (filter.status && record.status !== filter.status) {
        return false;
      }
      
      // Date range filter
      if (filter.dateRange) {
        const recordDate = new Date(record.createdAt);
        if (recordDate < filter.dateRange.start || recordDate > filter.dateRange.end) {
          return false;
        }
      }
      
      // Search filter
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const searchableText = `${record.title} ${record.description} ${record.category}`.toLowerCase();
        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }
      
      return true;
    });
  }
  
  static getUniqueCategories(records: DataRecord[]): string[] {
    const categories = records.map(record => record.category);
    return [...new Set(categories)].sort();
  }
  
  static getRecordStats(records: DataRecord[]) {
    const total = records.length;
    const active = records.filter(r => r.status === 'active').length;
    const inactive = records.filter(r => r.status === 'inactive').length;
    const totalValue = records.reduce((sum, r) => sum + r.value, 0);
    const avgValue = total > 0 ? totalValue / total : 0;
    
    return {
      total,
      active,
      inactive,
      totalValue,
      avgValue,
    };
  }
}

// Sample data for testing
export function generateSampleData(userId: string): void {
  const sampleRecords: DataForm[] = [
    {
      title: 'Monthly Revenue Report',
      description: 'Revenue analysis for Q4 2024',
      category: 'Finance',
      value: 15000,
      status: 'active',
    },
    {
      title: 'Customer Satisfaction Survey',
      description: 'Survey results from customer feedback',
      category: 'Marketing',
      value: 4.5,
      status: 'active',
    },
    {
      title: 'Product Launch Campaign',
      description: 'Campaign metrics and performance',
      category: 'Marketing',
      value: 8750,
      status: 'active',
    },
    {
      title: 'Staff Training Session',
      description: 'Employee development program results',
      category: 'HR',
      value: 2500,
      status: 'inactive',
    },
    {
      title: 'Website Analytics',
      description: 'Monthly website traffic and conversion',
      category: 'Technology',
      value: 12300,
      status: 'active',
    },
  ];
  
  sampleRecords.forEach(data => {
    DataManager.addRecord(userId, data);
  });
}

// Export utilities
export function prepareExportData(records: DataRecord[]): any[][] {
  const headers = [
    'ID',
    'Title',
    'Description',
    'Category',
    'Value',
    'Status',
    'Created At',
    'Updated At',
  ];
  
  const rows = records.map(record => [
    record.id,
    record.title,
    record.description,
    record.category,
    record.value,
    record.status,
    record.createdAt.toISOString(),
    record.updatedAt.toISOString(),
  ]);
  
  return [headers, ...rows];
}

// Import validation
export function validateImportData(data: any[]): { valid: DataForm[]; errors: string[] } {
  const valid: DataForm[] = [];
  const errors: string[] = [];
  
  data.forEach((row, index) => {
    try {
      const [, title, description, category, value, status] = row;
      
      const record = dataSchema.parse({
        title,
        description,
        category,
        value: parseFloat(value),
        status,
      });
      
      valid.push(record);
    } catch (error) {
      errors.push(`Row ${index + 1}: Invalid data format`);
    }
  });
  
  return { valid, errors };
}