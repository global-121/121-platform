import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { CreateProjectButtonComponent } from '~/pages/projects-overview/create-project-button/create-project-button.component';
import { ProjectSummaryCardComponent } from '~/pages/projects-overview/project-summary-card/project-summary-card.component';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-projects-overview',
  standalone: true,
  imports: [
    ButtonModule,
    CommonModule,
    PageLayoutComponent,
    RouterLink,
    ProjectSummaryCardComponent,
    CreateProjectButtonComponent,
  ],
  templateUrl: './projects-overview.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsOverviewComponent {
  private authService = inject(AuthService);

  public canCreateProjects = this.authService.isAdmin;

  public assignedProjects = this.authService.getAssignedProjectIds();
}