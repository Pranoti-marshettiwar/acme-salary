import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from './api.service';
import { money } from './format';
import { Group, Insights } from './models';
import { RangeBar } from './range-bar';

type GroupId = 'byCountry' | 'byDepartment' | 'byJobTitle';

@Component({
  selector: 'app-insights',
  imports: [MatButtonToggleModule, MatProgressSpinnerModule, RangeBar],
  template: `
    @if (error()) { <p class="error" role="alert">{{ error() }}</p> }
    @else if (!data()) { <mat-spinner diameter="32" aria-label="Loading insights" /> }
    @else {
      @let d = data()!;
      <div class="stack">
        <section class="panel pad">
          <h2>Across the organization (USD)</h2>
          <div class="stats">
            <div><span class="muted">People</span><b>{{ d.organization.count.toLocaleString() }}</b></div>
            <div><span class="muted">Median salary</span><b>{{ money(d.organization.median, 'USD') }}</b></div>
            <div><span class="muted">Average salary</span><b>{{ money(d.organization.mean, 'USD') }}</b></div>
            <div><span class="muted">Middle half earn</span>
              <b>{{ money(d.organization.p25, 'USD', true) }} – {{ money(d.organization.p75, 'USD', true) }}</b></div>
            <div><span class="muted">Lowest to highest</span>
              <b>{{ money(d.organization.min, 'USD', true) }} – {{ money(d.organization.max, 'USD', true) }}</b></div>
          </div>
          <p class="muted note">Cross-country figures convert local pay to USD at fixed rates, so comparisons are consistent but not market exchange rates.</p>
        </section>

        <section class="panel pad">
          <h2>How many people earn what (USD)</h2>
          <div class="hist" role="img" aria-label="Salary distribution histogram">
            @for (b of d.distribution; track b.from) {
              <span class="col" [style.height.%]="(b.count / maxBucket()) * 100"
                [title]="money(b.from, 'USD', true) + '–' + money(b.to, 'USD', true) + ': ' + b.count.toLocaleString() + ' people'"></span>
            }
          </div>
          <div class="axis muted"><span>$0</span><span>{{ money(d.distribution.at(-1)?.to ?? 0, 'USD', true) }}</span></div>
        </section>

        <section class="panel">
          <div class="pad"><h2>Pay by group</h2>
            <mat-button-toggle-group [value]="group()" (change)="group.set($event.value)" aria-label="Group by">
              <mat-button-toggle value="byCountry">Country</mat-button-toggle>
              <mat-button-toggle value="byDepartment">Department</mat-button-toggle>
              <mat-button-toggle value="byJobTitle">Job title</mat-button-toggle>
            </mat-button-toggle-group></div>
          <div class="scroll">
          <table>
            <thead><tr><th>{{ groupTitle() }}</th><th class="num">People</th><th>Range, middle half, median</th>
              <th class="num">Median</th><th class="num">Middle half</th></tr></thead>
            <tbody>
              @for (r of rows(); track r.key) {
                <tr><td>{{ r.key }}</td><td class="num">{{ r.count.toLocaleString() }}</td>
                  <!-- Country rows use different currencies, so each strip scales to its own max. -->
                  <td><app-range-bar [stats]="r" [domainMax]="group() === 'byCountry' ? r.max : sharedMax()" /></td>
                  <td class="num">{{ money(r.median, cur(r)) }}</td>
                  <td class="num">{{ money(r.p25, cur(r), true) }} – {{ money(r.p75, cur(r), true) }}</td></tr>
              }
            </tbody>
          </table></div>
          @if (group() === 'byJobTitle') { <p class="muted note pad">Only titles held by five or more people are shown.</p> }
        </section>

        <section class="panel">
          <div class="pad"><h2>Ten highest paid (USD)</h2></div>
          <div class="scroll"><table><tbody>
            @for (p of d.topPaid; track p.id) {
              <tr><td>{{ p.fullName }}</td><td>{{ p.jobTitle }}, {{ p.department }}</td><td>{{ p.country }}</td>
                <td class="num">{{ money(p.salaryUsd, 'USD') }}</td></tr>
            }
          </tbody></table></div>
        </section>
      </div>
    }`,
  styles: `
    .stack { display: grid; gap: 16px; } .pad { padding: 20px; } h2 { font-size: 1.125rem; font-weight: 600; margin: 0 0 12px; }
    .stats { display: flex; gap: 40px; flex-wrap: wrap; } .stats div { display: grid; gap: 2px; }
    .stats b { font-size: 1.375rem; font-weight: 600; font-variant-numeric: tabular-nums; }
    .note { max-width: 640px; margin: 16px 0 0; font-size: 14px; } .error { color: var(--danger); }
    .hist { display: flex; align-items: flex-end; gap: 3px; height: 140px; }
    .col { flex: 1; background: var(--accent); min-height: 2px; }
    .axis { display: flex; justify-content: space-between; font-size: 12px; margin-top: 4px; }
    .scroll { overflow-x: auto; } table { width: 100%; border-collapse: collapse; }
    th, td { padding: 8px 20px; border-top: 1px solid var(--line); text-align: left; font-size: 14px; }
    th { font-weight: 500; color: var(--muted); }
    th.num, td.num { text-align: right; font-variant-numeric: tabular-nums; }`,
})
export class InsightsPage implements OnInit {
  private api = inject(ApiService);
  money = money;
  data = signal<Insights | null>(null);
  error = signal('');
  group = signal<GroupId>('byCountry');

  rows = computed<Group[]>(() => this.data()?.[this.group()] ?? []);
  sharedMax = computed(() => Math.max(...this.rows().map((r) => r.max), 1));
  maxBucket = computed(() => Math.max(...(this.data()?.distribution.map((b) => b.count) ?? [1]), 1));
  groupTitle = computed(() => ({ byCountry: 'Country', byDepartment: 'Department', byJobTitle: 'Department / title' })[this.group()]);
  cur = (r: Group) => (this.group() === 'byCountry' ? r.currency ?? 'USD' : 'USD');

  ngOnInit() {
    this.api.insights().subscribe({ next: (d) => this.data.set(d), error: (e) => this.error.set(e.error?.error ?? 'Could not load insights.') });
  }
}
