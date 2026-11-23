import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { isWithinInterval, parseISO } from 'date-fns';

@Component({
  selector: 'app-maintenance-notice',
  templateUrl: './maintenance-notice.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass],
})
export class MaintenanceNoticeComponent {
  readonly contentContainerStyles = input<string>('');

  readonly showNotice = computed(() => {
    const isInTimeframe = isWithinInterval(new Date(), {
      start: parseISO('2026-11-23T00:00:00+01:00'),
      end: parseISO('2026-12-05T00:00:00+01:00'),
    });
    return isInTimeframe;
  });
}
