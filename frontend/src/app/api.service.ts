import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Employee, EmployeeInput, EmployeePage, Insights, ListParams, Meta } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  meta() { return this.http.get<Meta>('/api/meta'); }
  insights() { return this.http.get<Insights>('/api/insights'); }
  list(p: ListParams) {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(p)) if (v !== '' && v != null) params = params.set(k, String(v));
    return this.http.get<EmployeePage>('/api/employees', { params });
  }
  create(body: EmployeeInput) { return this.http.post<Employee>('/api/employees', body); }
  update(id: number, body: EmployeeInput) { return this.http.put<Employee>(`/api/employees/${id}`, body); }
  remove(id: number) { return this.http.delete<void>(`/api/employees/${id}`); }
}
