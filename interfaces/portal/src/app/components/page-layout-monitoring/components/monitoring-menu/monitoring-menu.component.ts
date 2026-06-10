import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { TabsModule } from 'primeng/tabs';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes, ProgramMonitoringPaths } from '~/app.routes';
import { TabsMenuComponent } from '~/components/tabs-menu/tabs-menu.component';
import { ProgramApiService } from '~/domains/program/program.api.service';
import { programHasPhysicalCardSupport } from '~/domains/program/program.helper';
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
  readonly programApiService = inject(ProgramApiService);

  program = injectQuery(this.programApiService.getProgram(this.programId));

  readonly navMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@page-title-program-monitoring-dashboard:Dashboard`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programMonitoring}/${ProgramMonitoringPaths.dashboard}`,
      icon: 'pi pi-chart-line',
    },
    {
      label: $localize`:@@page-title-program-monitoring-powerbi:PowerBI`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programMonitoring}/${ProgramMonitoringPaths.powerBI}`,
      icon: 'pi pi-chart-line',
    },
    {
      label: $localize`:@@page-title-program-monitoring-debit-cards:Debit Cards`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programMonitoring}/${ProgramMonitoringPaths.debitCards}`,
      icon: 'pi pi-credit-card',
      visible:
        programHasPhysicalCardSupport(this.program.data()) &&
        this.authService.hasPermission({
          programId: this.programId(),
          requiredPermission: PermissionEnum.FspDebitCardOrderREAD,
        }),
    },
    {
      label: $localize`:@@page-title-program-monitoring-data-changes:Data changes`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programMonitoring}/${ProgramMonitoringPaths.dataChanges}`,
      icon: 'pi pi-refresh',
    },
    {
      label: $localize`:@@page-title-program-monitoring-files:Files`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programMonitoring}/${ProgramMonitoringPaths.files}`,
      icon: 'pi pi-file',
      visible: this.authService.hasPermission({
        programId: this.programId(),
        requiredPermission: PermissionEnum.ProgramAttachmentsREAD,
      }),
    },
  ]);
}
