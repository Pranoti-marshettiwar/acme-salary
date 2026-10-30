import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Subject, catchError, debounceTime, of, switchMap, tap } from 'rxjs';
import { ApiService } from './api.service';
import { EmployeeDialog } from './employee-dialog';
import { money } from './format';
import { Employee, EmployeePage, Meta } from './models';

@Component({
  selector: 'app-employees',
  imports: [ReactiveFormsModule, MatTableModule, MatSortModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatProgressBarModule],
  template: `
    <section class="panel">
      <div class="filters">
        <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Search name or email</mat-label>
          <input matInput [formControl]="search" /></mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Country</mat-label>
          <mat-select [formControl]="country">
            <mat-option value="">All countries</mat-option>
            @for (c of countries(); track c) { <mat-option [value]="c">{{ c }}</mat-option> }
          </mat-select></mat-form-field>
        <mat-form-field appearance="outline" subscriptSizing="dynamic"><mat-label>Department</mat-label>
          <mat-select [formControl]="department">
            <mat-option value="">All departments</mat-option>
            @for (d of meta().departments; track d) { <mat-option [value]="d">{{ d }}</mat-option> }
          </mat-select></mat-form-field>
        <span class="spacer"></span>
        <button mat-flat-button (click)="openDialog(null)">Add employee</button>
      </div>
      @if (loading()) { <mat-progress-bar mode="indeterminate" /> } @else { <div class="gap"></div> }
      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

      <table mat-table [dataSource]="data().items" matSort (matSortChange)="onSort($event)"
        [matSortActive]="sortBy" [matSortDirection]="order" aria-label="Employees">
        <ng-container matColumnDef="fullName">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
          <td mat-cell *matCellDef="let e">{{ e.fullName }}<small class="muted">{{ e.email }}</small></td></ng-container>
        <ng-container matColumnDef="country">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Country</th><td mat-cell *matCellDef="let e">{{ e.country }}</td></ng-container>
        <ng-container matColumnDef="department">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Department</th><td mat-cell *matCellDef="let e">{{ e.department }}</td></ng-container>
        <ng-container matColumnDef="jobTitle">
          <th mat-header-cell *matHeaderCellDef mat-sort-header>Job title</th><td mat-cell *matCellDef="let e">{{ e.jobTitle }}</td></ng-container>
        <ng-container matColumnDef="salary">
          <th mat-header-cell *matHeaderCellDef mat-sort-header class="num">Annual salary</th>
          <td mat-cell *matCellDef="let e" class="num">{{ money(e.salary, e.currency) }}</td></ng-container>
        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef class="num">Actions</th>
          <td mat-cell *matCellDef="let e" class="num">
            <button mat-button (click)="openDialog(e)">Edit</button>
            <button mat-button class="danger" (click)="remove(e)">Delete</button></td></ng-container>
        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns"></tr>
      </table>
      @if (!loading() && data().items.length === 0) {
        <p class="empty muted">No employees match these filters. Clear the search or choose a different country or department.</p>
      }
      <mat-paginator [length]="data().total" [pageSize]="pageSize" [pageIndex]="page" [pageSizeOptions]="[25, 50, 100]"
        (page)="onPage($event)" />
    </section>`,
  styles: `
    .filters { display: flex; gap: 16px; padding: 16px; flex-wrap: wrap; align-items: center; }
    .spacer { flex: 1; } .gap { height: 4px; }
    table { width: 100%; } small { display: block; font-size: 12px; }
    .error { color: var(--danger); padding: 0 16px; } .empty { text-align: center; padding: 40px 16px; }
    .danger { color: var(--danger); } th.num { text-align: right; }`,
})
export class EmployeesPage implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);
  private destroyRef = inject(DestroyRef);

  columns = ['fullName', 'country', 'department', 'jobTitle', 'salary', 'actions'];
  money = money;
  meta = signal<Meta>({ countries: {}, departments: [], rates: {} });
  countries = signal<string[]>([]);
  data = signal<EmployeePage>({ items: [], total: 0, page: 1, pageSize: 25, totalPages: 1 });
  loading = signal(true);
  error = signal('');

  search = new FormControl('', { nonNullable: true });
  country = new FormControl('', { nonNullable: true });
  department = new FormControl('', { nonNullable: true });
  sortBy = 'fullName';
  order: 'asc' | 'desc' = 'asc';
  page = 0;
  pageSize = 25;

  private reload$ = new Subject<void>();

  ngOnInit() {
    this.api.meta().subscribe((m) => { this.meta.set(m); this.countries.set(Object.keys(m.countries)); });

    // switchMap cancels an in-flight request when a newer one starts, so slow responses never overwrite fresh ones.
    this.reload$.pipe(
      tap(() => { this.loading.set(true); this.error.set(''); }),
      switchMap(() => this.api.list({
        q: this.search.value, country: this.country.value, department: this.department.value,
        sortBy: this.sortBy, order: this.order, page: this.page + 1, pageSize: this.pageSize,
      }).pipe(catchError((e) => { this.error.set(e.error?.error ?? 'Could not load employees.'); return of(null); }))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((res) => { if (res) this.data.set(res); this.loading.set(false); });

    this.search.valueChanges.pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef)).subscribe(() => this.resetAndLoad());
    this.country.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.resetAndLoad());
    this.department.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.resetAndLoad());
    this.reload$.next();
  }

  private resetAndLoad() { this.page = 0; this.reload$.next(); }
  onSort(s: Sort) { this.sortBy = s.active; this.order = s.direction === 'desc' ? 'desc' : 'asc'; this.resetAndLoad(); }
  onPage(e: PageEvent) { this.page = e.pageIndex; this.pageSize = e.pageSize; this.reload$.next(); }

  openDialog(employee: Employee | null) {
    this.dialog.open(EmployeeDialog, { data: { employee, meta: this.meta() }, autoFocus: 'first-tabbable' })
      .afterClosed().subscribe((saved) => { if (saved) this.reload$.next(); });
  }

  remove(e: Employee) {
    if (!window.confirm(`Delete ${e.fullName}? This cannot be undone.`)) return;
    this.api.remove(e.id).subscribe({
      next: () => this.reload$.next(),
      error: (err) => this.error.set(err.error?.error ?? 'Could not delete.'),
    });
  }
}
