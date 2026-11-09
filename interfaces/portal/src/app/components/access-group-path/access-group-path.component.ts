import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-access-group-path',
  template: `
    <span class="inline-flex flex-wrap items-center gap-1">
      @for (label of labels(); track $index) {
        @if (!$first) {
          <bdi [dir]="direction()">{{ separator() }}</bdi>
        }
        <bdi>{{ label }}</bdi>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessGroupPathComponent {
  readonly labels = input.required<string[]>();
  private readonly rtlHelper = inject(RtlHelperService);
  readonly direction = computed(() => (this.rtlHelper.isRtl() ? 'rtl' : 'ltr'));
  readonly separator = computed(() => (this.direction() === 'rtl' ? '<' : '>'));
}
