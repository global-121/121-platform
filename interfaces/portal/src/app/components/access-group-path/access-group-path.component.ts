import {
  ChangeDetectionStrategy,
  Component,
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
          <i
            [class]="chevronIcon()"
            aria-hidden="true"
          ></i>
        }
        <bdi>{{ label }}</bdi>
      }
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessGroupPathComponent {
  readonly labels = input.required<string[]>();
  readonly chevronIcon =
    inject(RtlHelperService).createRtlFriendlyChevronIcon('forward');
}
