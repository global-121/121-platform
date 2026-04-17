import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardModule } from 'primeng/card';

import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { KoboIntegrationCardComponent } from '~/pages/program-settings-registration-data/components/kobo-integration-card/kobo-integration-card.component';

@Component({
  selector: 'app-program-settings-registration-data',
  imports: [
    CardModule,
    PageLayoutProgramSettingsComponent,
    KoboIntegrationCardComponent,
  ],
  templateUrl: './program-settings-registration-data.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsRegistrationDataPageComponent {
  readonly programId = input.required<string>();
}
