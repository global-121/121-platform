import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ButtonModule } from 'primeng/button';

import { CardGridComponent } from '~/components/card-grid/card-grid.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { CreateProjectDialogComponent } from '~/pages/projects-overview/components/create-project-dialog/create-project-dialog.component';
import { ProjectSummaryCardComponent } from '~/pages/projects-overview/components/project-summary-card/project-summary-card.component';
import { AuthService } from '~/services/auth.service';
import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-projects-overview',
  imports: [
    ButtonModule,
    PageLayoutComponent,
    ProjectSummaryCardComponent,
    CreateProjectDialogComponent,
    CardGridComponent,
  ],
  templateUrl: './projects-overview.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsOverviewPageComponent {
  readonly rtlHelper = inject(RtlHelperService);
  private authService = inject(AuthService);

  public canCreateProjects = this.authService.isAdmin;

  public assignedProjects = this.authService.getAssignedProjectIds();
}
