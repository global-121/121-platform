import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-project-settings-budget',
  imports: [],
  templateUrl: './project-settings-budget.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsBudgetComponent {
  readonly projectId = input.required<string>();
}
