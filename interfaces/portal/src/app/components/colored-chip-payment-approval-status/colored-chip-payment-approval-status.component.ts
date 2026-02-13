import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';

@Component({
  selector: 'app-colored-chip-payment-approval-status',
  imports: [ColoredChipComponent],
  templateUrl: './colored-chip-payment-approval-status.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColoredChipPaymentApprovalStatusComponent {
  readonly isPaymentApproved = input.required<boolean>();
  readonly approvalsGiven = input.required<number>();
  readonly approvalsRequired = input.required<number>();

  readonly label = computed(() => {
    if (this.isPaymentApproved()) {
      return $localize`Approved`;
    }

    return $localize`${this.approvalsGiven()} of ${this.approvalsRequired()} approved`;
  });

  readonly variant = computed(() => {
    if (this.isPaymentApproved()) {
      return 'purple';
    }

    return 'orange';
  });
}
