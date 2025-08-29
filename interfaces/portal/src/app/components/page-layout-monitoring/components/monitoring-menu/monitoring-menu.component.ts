import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { MenuItem } from 'primeng/api';
import { TabsModule } from 'primeng/tabs';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { TabsMenuComponent } from '~/components/tabs-menu/tabs-menu.component';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-monitoring-menu',
  imports: [TabsModule, TabsMenuComponent],
  templateUrl: './monitoring-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringMenuComponent {
  readonly projectId = input.required<string>();

  readonly authService = inject(AuthService);

  readonly navMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@page-title-project-monitoring-powerbi:PowerBI`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectMonitoring}/${AppRoutes.projectMonitoringPowerBI}`,
      icon: 'pi pi-chart-line',
    },
    {
      label: $localize`:@@page-title-project-monitoring-files:Files`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectMonitoring}/${AppRoutes.projectMonitoringFiles}`,
      icon: 'pi pi-file',
      visible: this.authService.hasPermission({
        projectId: this.projectId(),
        requiredPermission: PermissionEnum.ProjectAttachmentsREAD,
      }),
    },
  ]);
}
