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
  selector: 'app-page-layout-project-settings',
  imports: [PageLayoutComponent, RouterLink, RouterLinkActive],
  templateUrl: './page-layout-project-settings.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutProjectSettingsComponent {
  readonly projectId = input.required<string>();

  readonly authService = inject(AuthService);

  readonly menuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`Project information`,
      icon: 'pi pi-info-circle',
      routerLink: [
        '/',
        AppRoutes.project,
        this.projectId(),
        AppRoutes.projectSettings,
        AppRoutes.projectSettingsInformation,
      ],
      visible: this.authService.hasPermission({
        projectId: this.projectId(),
        requiredPermission: PermissionEnum.ProgramUPDATE,
      }),
    },
    {
      label: $localize`FSP`,
      icon: 'pi pi-money-bill',
      routerLink: [
        '/',
        AppRoutes.project,
        this.projectId(),
        AppRoutes.projectSettings,
        AppRoutes.projectSettingsFsps,
      ],
      visible: this.authService.isAdmin,
    },
    {
      label: $localize`Registration data`,
      icon: 'pi pi-file-edit',
      routerLink: [
        '/',
        AppRoutes.project,
        this.projectId(),
        AppRoutes.projectSettings,
        AppRoutes.projectSettingsRegistrationData,
      ],
      visible: this.authService.isAdmin,
    },
    {
      label: $localize`:@@page-title-project-settings-team:Project team`,
      icon: 'pi pi-users',
      routerLink: [
        '/',
        AppRoutes.project,
        this.projectId(),
        AppRoutes.projectSettings,
        AppRoutes.projectSettingsTeam,
      ],
      visible: this.authService.hasPermission({
        projectId: this.projectId(),
        requiredPermission: PermissionEnum.AidWorkerProgramREAD,
      }),
    },
  ]);
}
