import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { MenuItem } from 'primeng/api';

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { AuthService } from '~/services/auth.service';

const BASE_URL = (programId: number | string) => [
  '/',
  AppRoutes.program,
  String(programId),
  AppRoutes.programSettings,
];

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
  private readonly router = inject(Router);

  // NOTE: Make sure to align the permissions used here with those used in the routing config in: `app.routes.ts`
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
      label: $localize`FSP integration`,
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
      visible: this.authService.hasPermission({
        programId: this.programId(),
        requiredPermission: PermissionEnum.ProgramKoboREAD,
      }),
    },
    {
      label: $localize`:@@page-title-users:Users`,
      icon: 'pi pi-users',
      routerLink: [
        '/',
        AppRoutes.program,
        this.programId(),
        AppRoutes.programSettings,
        AppRoutes.users,
        AppRoutes.programSettingsTeam,
      ],
      visible: this.authService.hasSomePermission({
        programId: this.programId(),
        optionalPermissions: [
          PermissionEnum.AidWorkerProgramREAD,
          PermissionEnum.ProgramApprovalThresholdsREAD,
        ],
      }),
      items: [
        {
          label: $localize`:@@page-title-program-settings-team:Program team`,
          routerLink: [
            '/',
            AppRoutes.program,
            this.programId(),
            AppRoutes.programSettings,
            AppRoutes.users,
            AppRoutes.programSettingsTeam,
          ],
          visible: this.authService.hasPermission({
            programId: this.programId(),
            requiredPermission: PermissionEnum.AidWorkerProgramREAD,
          }),
        },
        {
          label: $localize`:@@page-title-program-settings-payment-approval:Payment approval`,
          routerLink: [
            '/',
            AppRoutes.program,
            this.programId(),
            AppRoutes.programSettings,
            AppRoutes.users,
            AppRoutes.programSettingsPaymentApproval,
          ],
          visible: this.authService.hasPermission({
            programId: this.programId(),
            requiredPermission: PermissionEnum.ProgramApprovalThresholdsREAD,
          }),
        },
      ],
    },
  ]);

  isParentActive(routerLink: (number | string)[]) {
    const slicedBaseUrl = new Set(BASE_URL(this.programId()).slice(1));
    const parentFromUrl = this.router.url
      .split('/')
      .slice(1)
      .find((x) => !slicedBaseUrl.has(x));
    const parentFromItem = routerLink
      .slice(1)
      .find((x) => !slicedBaseUrl.has(String(x)));
    return parentFromUrl === parentFromItem;
  }
}
