import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PageLayoutProjectSettingsComponent } from '~/components/page-layout-project-settings/page-layout-project-settings.component';
import { ProjectSettingsBasicInformationComponent } from '~/pages/project-settings-information/components/project-settings-basic-information/project-settings-basic-information.component';
import { ProjectSettingsBudgetComponent } from '~/pages/project-settings-information/components/project-settings-budget/project-settings-budget.component';

@Component({
  selector: 'app-project-settings-information',
  imports: [
    PageLayoutProjectSettingsComponent,
    ProjectSettingsBasicInformationComponent,
    ProjectSettingsBudgetComponent,
  ],
  providers: [],
  templateUrl: './project-settings-information.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsInformationPageComponent {
  readonly projectId = input.required<string>();
}
