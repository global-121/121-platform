import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { CardModule } from 'primeng/card';

import { ProjectSettingsPageLayoutComponent } from '~/components/project-settings-page-layout/project-settings-page-layout.component';

@Component({
  selector: 'app-project-settings-financial-service-providers',
  imports: [ProjectSettingsPageLayoutComponent, CardModule],
  templateUrl: './project-settings-financial-service-providers.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsFinancialServiceProvidersPageComponent {
  readonly projectId = input.required<string>();
}
