import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { ProgramSettingsBasicInformationComponent } from '~/pages/program-settings-information/components/program-settings-basic-information/program-settings-basic-information.component';
import { ProgramSettingsBudgetComponent } from '~/pages/program-settings-information/components/program-settings-budget/program-settings-budget.component';

@Component({
  selector: 'app-program-settings-information',
  imports: [
    PageLayoutProgramSettingsComponent,
    ProgramSettingsBasicInformationComponent,
    ProgramSettingsBudgetComponent,
  ],
  providers: [],
  templateUrl: './program-settings-information.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsInformationPageComponent {
  readonly programId = input.required<string>();
}
