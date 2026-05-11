import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-no-eligible-approvers-message',
  templateUrl: './no-eligible-approvers-message.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoEligibleApproversMessageComponent {}
