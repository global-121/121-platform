import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { TabMenuModule } from 'primeng/tabmenu';
import { AppRoutes } from '~/app.routes';

@Component({
  selector: 'app-project-header',
  standalone: true,
  imports: [TabMenuModule],
  templateUrl: './project-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectHeaderComponent {
  projectId = input.required<string>();

  navMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`Overview`,
      routerLink: `/${AppRoutes.project}/${this.projectId()}/${AppRoutes.projectOverview}`,
      icon: 'pi pi-chart-bar',
    },
    {
      label: $localize`Registrations`,
      routerLink: `/${AppRoutes.project}/${this.projectId()}/${AppRoutes.projectRegistrations}`,
      icon: 'pi pi-file-edit',
    },
    {
      label: $localize`Payments`,
      routerLink: `/${AppRoutes.project}/${this.projectId()}/${AppRoutes.projectPayments}`,
      icon: 'pi pi-money-bill',
    },
    {
      label: $localize`Team`,
      routerLink: `/${AppRoutes.project}/${this.projectId()}/${AppRoutes.projectTeam}`,
      styleClass: 'ms-auto',
      icon: 'pi pi-users',
    },
  ]);
}
