import { Component } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { EmployeesPage } from './employees-page';
import { InsightsPage } from './insights-page';

@Component({
  selector: 'app-root',
  imports: [MatTabsModule, EmployeesPage, InsightsPage],
  template: `
    <main>
      <h1>ACME salaries</h1>
      <!-- Lazy tab content is destroyed when you leave a tab, so Insights always refetches after edits. -->
      <mat-tab-group animationDuration="0ms" aria-label="Sections">
        <mat-tab label="Employees"><ng-template matTabContent><div class="body"><app-employees /></div></ng-template></mat-tab>
        <mat-tab label="How we pay"><ng-template matTabContent><div class="body"><app-insights /></div></ng-template></mat-tab>
      </mat-tab-group>
    </main>`,
  styles: `main { max-width: 1536px; margin: 0 auto; padding: 24px; } h1 { font-size: 1.5rem; font-weight: 600; margin: 0 0 8px; } .body { padding-top: 16px; }`,
})
export class App {}
