import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmDialogModule } from 'primeng/confirmdialog';

import { FormDialogComponent } from '~/components/form-dialog/form-dialog.component';
import { PageLayoutProjectSettingsComponent } from '~/components/page-layout-project-settings/page-layout-project-information.component';
import { QueryTableComponent } from '~/components/query-table/query-table.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { AddProjectTeamUserDialogComponent } from '~/pages/project-settings-team/components/add-project-team-user-dialog/add-project-team-user-dialog.component';
import { AuthService } from '~/services/auth.service';
import { RtlHelperService } from '~/services/rtl-helper.service';
import { ToastService } from '~/services/toast.service';

@Component({
  selector: 'app-project-settings-information',
  imports: [
    ButtonModule,
    CardModule,
    QueryTableComponent,
    AddProjectTeamUserDialogComponent,
    ConfirmDialogModule,
    FormDialogComponent,
    PageLayoutProjectSettingsComponent,
  ],
  providers: [ToastService],
  templateUrl: './project-settings-information.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsInformationPageComponent {
  readonly rtlHelper = inject(RtlHelperService);
  readonly projectId = input.required<string>();

  private projectApiService = inject(ProjectApiService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
}
