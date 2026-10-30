import { Component, computed, input } from '@angular/core';
import { Group } from './models';
import { pct } from './format';

/** Min–max strip, middle 50% shaded, marker at the median. */
@Component({
  selector: 'app-range-bar',
  template: `
    <div class="bar" role="img" [attr.aria-label]="label()">
      <span class="line" [style.left]="p(stats().min)" [style.width]="w(stats().min, stats().max)"></span>
      <span class="iqr" [style.left]="p(stats().p25)" [style.width]="w(stats().p25, stats().p75)"></span>
      <span class="median" [style.left]="p(stats().median)"></span>
    </div>`,
  styles: `
    .bar { position: relative; height: 14px; min-width: 160px; }
    .line { position: absolute; top: 6px; height: 2px; background: var(--line); }
    .iqr { position: absolute; top: 2px; height: 10px; background: var(--accent-soft); }
    .median { position: absolute; top: 0; height: 14px; width: 3px; margin-left: -1px; background: var(--accent); }`,
})
export class RangeBar {
  stats = input.required<Group>();
  domainMax = input.required<number>();
  label = computed(() => `Range ${this.stats().min} to ${this.stats().max}, median ${this.stats().median}`);
  p = (v: number) => pct(v, this.domainMax());
  w = (a: number, b: number) => `calc(${this.p(b)} - ${this.p(a)})`;
}
