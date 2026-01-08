import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MenuItem } from 'primeng/api';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-page-layout-program-settings',
  imports: [PageLayoutComponent, RouterLink, RouterLinkActive],
  templateUrl: './page-layout-program-settings.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutProgramSettingsComponent {
  readonly programId = input.required<string>();

  readonly authService = inject(AuthService);

  readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`Program information`,
      icon: 'pi pi-info-circle',
      routerLink: [
        '/',
        AppRoutes.program,
        this.programId(),
        AppRoutes.programSettings,
        AppRoutes.programSettingsInformation,
      ],
      visible: this.authService.hasPermission({
        programId: this.programId(),
        requiredPermission: PermissionEnum.ProgramUPDATE,
      }),
    },
    {
      label: $localize`FSP`,
      icon: 'pi pi-money-bill',
      routerLink: [
        '/',
        AppRoutes.program,
        this.programId(),
        AppRoutes.programSettings,
        AppRoutes.programSettingsFsps,
      ],
      visible: this.authService.isAdmin,
    },
    {
      label: $localize`Registration data`,
      icon: 'pi pi-file-edit',
      routerLink: [
        '/',
        AppRoutes.program,
        this.programId(),
        AppRoutes.programSettings,
        AppRoutes.programSettingsRegistrationData,
      ],
      visible: this.authService.isAdmin,
    },
    {
      label: $localize`:@@page-title-program-settings-team:Program team`,
      icon: 'pi pi-users',
      routerLink: [
        '/',
        AppRoutes.program,
        this.programId(),
        AppRoutes.programSettings,
        AppRoutes.programSettingsTeam,
      ],
      visible: this.authService.hasPermission({
        programId: this.programId(),
        requiredPermission: PermissionEnum.AidWorkerProgramREAD,
      }),
    },
  ]);
}
