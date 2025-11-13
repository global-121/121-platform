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
  selector: 'app-program-menu',
  imports: [TabsMenuComponent],
  templateUrl: './program-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramMenuComponent {
  private authService = inject(AuthService);
  readonly programId = input.required<string>();

  readonly navMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@page-title-program-registrations:Registrations`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programRegistrations}`,
      icon: 'pi pi-file-edit',
    },
    {
      label: $localize`:@@page-title-program-payments:Payments`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programPayments}`,
      icon: 'pi pi-money-bill',
    },
    {
      label: $localize`:@@page-title-program-monitoring:Monitoring`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programMonitoring}`,
      icon: 'pi pi-chart-bar',
      visible: this.authService.hasPermission({
        programId: this.programId(),
        requiredPermission: PermissionEnum.ProgramMetricsREAD,
      }),
    },
    {
      label: $localize`:@@page-title-program-settings:Settings`,
      // We link to the root of the program settings page, which is currently
      // not a page itself. We decide in app.routes.ts where to redirect to
      // based on permissions.
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programSettings}`,
      styleClass: 'ms-auto',
      icon: 'pi pi-cog',
      visible:
        this.authService.hasPermission({
          programId: this.programId(),
          requiredPermission: PermissionEnum.AidWorkerProgramREAD,
        }) ||
        this.authService.hasPermission({
          programId: this.programId(),
          requiredPermission: PermissionEnum.ProgramUPDATE,
        }),
    },
  ]);
}
