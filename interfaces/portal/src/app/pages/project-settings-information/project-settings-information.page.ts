import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { PageLayoutProjectSettingsComponent } from '~/components/page-layout-project-settings/page-layout-project-settings.component';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-settings-information',
  imports: [
    ButtonModule,
    CardModule,
    ConfirmDialogModule,
    PageLayoutProjectSettingsComponent,
  ],
  providers: [ToastService],
  templateUrl: './project-settings-information.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsInformationPageComponent {
  readonly projectId = input.required<string>();
}
