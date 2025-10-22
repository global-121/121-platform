import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-manual-link',
  imports: [],
  template: `
    <a
      href="https://manual.121.global/"
      target="_blank"
      title="Opens in a new window"
      i18n-title="@@generic-opens-in-new-window"
      class="inline-block [&_span:first-child]:underline hover:[&_span:first-child]:no-underline focus:[&_span:first-child]:no-underline"
      ><span i18n="@@generic-121-manual-title">121 Manual</span>
      <span class="p-button-icon pi pi-external-link ms-1 text-sm"></span
    ></a>
  `,
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualLinkComponent {}
