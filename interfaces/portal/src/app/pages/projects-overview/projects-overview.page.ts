import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { CardGridComponent } from '~/components/card-grid/card-grid.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { CreateProjectComponent } from '~/pages/projects-overview/components/create-project/create-project.component';
import { ProjectSummaryCardComponent } from '~/pages/projects-overview/components/project-summary-card/project-summary-card.component';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-projects-overview',
  imports: [
    PageLayoutComponent,
    ProjectSummaryCardComponent,
    CardGridComponent,
    CreateProjectComponent,
  ],
  templateUrl: './projects-overview.page.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsOverviewPageComponent {
  private authService = inject(AuthService);

  public canCreateProjects = this.authService.isAdmin;

  public assignedProjects = this.authService.getAssignedProjectIds();
}
