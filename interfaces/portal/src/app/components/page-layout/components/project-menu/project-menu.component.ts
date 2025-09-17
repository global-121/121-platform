import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { MenuItem } from 'primeng/api';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { TabsMenuComponent } from '~/components/tabs-menu/tabs-menu.component';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-project-menu',
  imports: [TabsMenuComponent],
  templateUrl: './project-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectMenuComponent {
  private authService = inject(AuthService);
  readonly projectId = input.required<string>();

  readonly navMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@page-title-project-registrations:Registrations`,
      routerLink: `/${AppRoutes.project}/${this.projectId()}/${AppRoutes.projectRegistrations}`,
      icon: 'pi pi-file-edit',
    },
    {
      label: $localize`:@@page-title-project-payments:Payments`,
      routerLink: `/${AppRoutes.project}/${this.projectId()}/${AppRoutes.projectPayments}`,
      icon: 'pi pi-money-bill',
    },
    {
      label: $localize`:@@page-title-project-monitoring:Monitoring`,
      routerLink: `/${AppRoutes.project}/${this.projectId()}/${AppRoutes.projectMonitoring}`,
      icon: 'pi pi-chart-bar',
      visible: this.authService.hasPermission({
        projectId: this.projectId(),
        requiredPermission: PermissionEnum.ProgramMetricsREAD,
      }),
    },
    {
      label: $localize`:@@page-title-project-settings:Settings`,
      routerLink: `/${AppRoutes.project}/${this.projectId()}/${AppRoutes.projectSettings}`,
      styleClass: 'ms-auto',
      icon: 'pi pi-cog',
      visible: this.authService.hasPermission({
        projectId: this.projectId(),
        requiredPermission: PermissionEnum.AidWorkerProgramREAD,
      }),
    },
  ]);
}
