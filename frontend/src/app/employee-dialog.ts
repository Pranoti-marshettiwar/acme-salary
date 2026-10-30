import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ApiService } from './api.service';
import { Employee, EmployeeInput, Meta } from './models';

export interface DialogData { employee: Employee | null; meta: Meta; }

@Component({
  selector: 'app-employee-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  template: `
    <h2 mat-dialog-title>{{ data.employee ? 'Edit ' + data.employee.fullName : 'Add employee' }}</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="form" (ngSubmit)="save()" id="employee-form">
        @if (formError()) { <p class="error" role="alert">{{ formError() }}</p> }
        <mat-form-field appearance="outline"><mat-label>Full name</mat-label>
          <input matInput formControlName="fullName" />
          <mat-error>{{ err('fullName') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" />
          <mat-error>{{ err('email') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Country</mat-label>
          <mat-select formControlName="country">
            @for (c of countries; track c) { <mat-option [value]="c">{{ c }}</mat-option> }
          </mat-select><mat-error>{{ err('country') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Department</mat-label>
          <mat-select formControlName="department">
            @for (d of data.meta.departments; track d) { <mat-option [value]="d">{{ d }}</mat-option> }
          </mat-select><mat-error>{{ err('department') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Job title</mat-label>
          <input matInput formControlName="jobTitle" /><mat-error>{{ err('jobTitle') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline">
          <mat-label>Annual salary{{ currency() ? ' (' + currency() + ')' : '' }}</mat-label>
          <input matInput formControlName="salary" type="number" min="0" step="any" />
          <mat-error>{{ err('salary') }}</mat-error></mat-form-field>
        <mat-form-field appearance="outline"><mat-label>Hire date</mat-label>
          <input matInput formControlName="hireDate" type="date" /><mat-error>{{ err('hireDate') }}</mat-error></mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close>Cancel</button>
      <button mat-flat-button type="submit" form="employee-form" [disabled]="saving()">
        {{ data.employee ? 'Save changes' : 'Add employee' }}</button>
    </mat-dialog-actions>`,
  styles: `.form { display: grid; gap: 4px; padding-top: 8px; min-width: min(480px, 80vw); } .error { color: var(--danger); margin: 0 0 8px; }`,
})
export class EmployeeDialog {
  data = inject<DialogData>(MAT_DIALOG_DATA);
  private ref = inject(MatDialogRef<EmployeeDialog>);
  private api = inject(ApiService);
  private fb = inject(FormBuilder);

  countries = Object.keys(this.data.meta.countries);
  saving = signal(false);
  formError = signal('');
  form = this.fb.nonNullable.group({
    fullName: [this.data.employee?.fullName ?? '', Validators.required],
    email: [this.data.employee?.email ?? '', [Validators.required, Validators.email]],
    country: [this.data.employee?.country ?? '', Validators.required],
    department: [this.data.employee?.department ?? '', Validators.required],
    jobTitle: [this.data.employee?.jobTitle ?? '', Validators.required],
    salary: [this.data.employee ? String(this.data.employee.salary) : '', Validators.required],
    hireDate: [this.data.employee?.hireDate ?? '', Validators.required],
  });
  currency = signal(this.data.meta.countries[this.form.controls.country.value] ?? '');

  constructor() {
    this.form.controls.country.valueChanges.subscribe((c) => this.currency.set(this.data.meta.countries[c] ?? ''));
  }

  err(name: keyof typeof this.form.controls): string {
    const e = this.form.controls[name].errors;
    if (!e) return '';
    return e['server'] ?? (e['email'] ? 'Enter a valid email address' : 'This field is required');
  }

  save() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const raw = this.form.getRawValue();
    const body = { ...raw, salary: Number(raw.salary) } as EmployeeInput;
    this.saving.set(true);
    this.formError.set('');
    const req = this.data.employee ? this.api.update(this.data.employee.id, body) : this.api.create(body);
    req.subscribe({
      next: () => this.ref.close(true),
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        const details: Record<string, string> = e.error?.details ?? {};
        for (const [field, message] of Object.entries(details)) {
          const ctl = this.form.get(field);
          ctl?.setErrors({ server: message });
          ctl?.markAsTouched();
        }
        if (e.status === 409) this.form.controls.email.setErrors({ server: e.error?.error });
        else if (!Object.keys(details).length) this.formError.set(e.error?.error ?? 'Could not save. Try again.');
      },
    });
  }
}
