import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardModule } from 'primeng/card';

import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { IntegrateKoboButtonComponent } from '~/pages/program-settings-registration-data/components/integrate-kobo-button/integrate-kobo-button.component';

@Component({
  selector: 'app-program-settings-registration-data',
  imports: [
    CardModule,
    PageLayoutProgramSettingsComponent,
    IntegrateKoboButtonComponent,
  ],
  templateUrl: './program-settings-registration-data.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsRegistrationDataPageComponent {
  readonly programId = input.required<string>();
}
