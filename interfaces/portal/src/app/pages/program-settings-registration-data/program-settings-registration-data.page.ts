import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardModule } from 'primeng/card';

import { ManualLinkComponent } from '~/components/manual-link/manual-link.component';
import { PageLayoutProgramSettingsComponent } from '~/components/page-layout-program-settings/page-layout-program-settings.component';
import { KoboIntegrationCardComponent } from '~/pages/program-settings-registration-data/components/kobo-integration-card/kobo-integration-card.component';
import { RegistrationQuestionsCardComponent } from '~/pages/program-settings-registration-data/components/registration-questions-card/registration-questions-card.component';
import { RequiredAttributesComponent } from '~/pages/program-settings-registration-data/components/required-attributes/required-attributes.component';

@Component({
  selector: 'app-program-settings-registration-data',
  imports: [
    CardModule,
    PageLayoutProgramSettingsComponent,
    KoboIntegrationCardComponent,
    RequiredAttributesComponent,
    ManualLinkComponent,
    RegistrationQuestionsCardComponent,
  ],
  templateUrl: './program-settings-registration-data.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramSettingsRegistrationDataPageComponent {
  readonly programId = input.required<string>();
}
