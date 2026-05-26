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

import { AppRoutes, ProgramMonitoringPaths } from '~/app.routes';
import { TabsMenuComponent } from '~/components/tabs-menu/tabs-menu.component';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-monitoring-menu',
  imports: [TabsModule, TabsMenuComponent],
  templateUrl: './monitoring-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonitoringMenuComponent {
  readonly programId = input.required<string>();

  readonly authService = inject(AuthService);

  readonly navMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@page-title-program-monitoring-dashboard:Dashboard`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programMonitoring}/${ProgramMonitoringPaths.Dashboard}`,
      icon: 'pi pi-chart-line',
    },
    {
      label: $localize`:@@page-title-program-monitoring-powerbi:PowerBI`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programMonitoring}/${ProgramMonitoringPaths.PowerBI}`,
      icon: 'pi pi-chart-line',
    },
    {
      label: $localize`:@@page-title-program-monitoring-debit-cards:Debit Cards`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programMonitoring}/${ProgramMonitoringPaths.DebitCards}`,
      icon: 'pi pi-credit-card',
      visible: false,
    },
    {
      label: $localize`:@@page-title-program-monitoring-data-changes:Data changes`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programMonitoring}/${ProgramMonitoringPaths.DataChanges}`,
      icon: 'pi pi-refresh',
    },
    {
      label: $localize`:@@page-title-program-monitoring-files:Files`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programMonitoring}/${ProgramMonitoringPaths.Files}`,
      icon: 'pi pi-file',
      visible: this.authService.hasPermission({
        programId: this.programId(),
        requiredPermission: PermissionEnum.ProgramAttachmentsREAD,
      }),
    },
  ]);
}
