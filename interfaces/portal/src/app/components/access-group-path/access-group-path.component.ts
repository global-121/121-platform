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
    <span class="inline-flex items-center gap-1">
      @for (label of labels(); track $index) {
        @if (!$first) {
          <bdi dir="ltr">{{ separator() }}</bdi>
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
  readonly separator = computed(() => (this.rtlHelper.isRtl() ? '<' : '>'));
}
