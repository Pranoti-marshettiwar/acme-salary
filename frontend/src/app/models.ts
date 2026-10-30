export interface Employee {
  id: number; fullName: string; email: string; country: string; department: string;
  jobTitle: string; currency: string; salary: number; hireDate: string;
}
export interface EmployeePage { items: Employee[]; total: number; page: number; pageSize: number; totalPages: number; }
export interface Meta { countries: Record<string, string>; departments: string[]; rates: Record<string, number>; }
export interface Summary { count: number; min: number; p25: number; median: number; mean: number; p75: number; max: number; }
export type Group = Summary & { key: string; currency?: string };
export interface Insights {
  currency: string; organization: Summary; byCountry: Group[]; byDepartment: Group[]; byJobTitle: Group[];
  distribution: { from: number; to: number; count: number }[];
  topPaid: { id: number; fullName: string; country: string; department: string; jobTitle: string; salaryUsd: number }[];
}
export type EmployeeInput = Omit<Employee, 'id' | 'currency'>;
export interface ListParams { q: string; country: string; department: string; sortBy: string; order: string; page: number; pageSize: number; }
