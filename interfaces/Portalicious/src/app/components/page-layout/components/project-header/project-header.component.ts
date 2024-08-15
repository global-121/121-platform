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
  projectId = input.required<number>();

  navMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@page-title-project-registrations:Registrations`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectRegistrations}`,
      icon: 'pi pi-file-edit',
    },
    {
      label: $localize`:@@page-title-project-payments:Payments`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectPayments}`,
      icon: 'pi pi-money-bill',
    },
    {
      label: $localize`:@@page-title-project-monitoring:Monitoring`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectMonitoring}`,
      icon: 'pi pi-chart-bar',
    },
    {
      label: $localize`:@@page-title-project-team:Team`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectTeam}`,
      styleClass: 'ms-auto',
      icon: 'pi pi-users',
    },
  ]);
}
