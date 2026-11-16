import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MenuItem } from '@openng/optimus-ui/api';
import { AutoFocusModule } from '@openng/optimus-ui/autofocus';
import { ButtonModule } from '@openng/optimus-ui/button';
import { DrawerModule } from '@openng/optimus-ui/drawer';
import { FocusTrapModule } from '@openng/optimus-ui/focustrap';
import { MenuModule } from '@openng/optimus-ui/menu';
import { ToolbarModule } from '@openng/optimus-ui/toolbar';

import { AppRoutes } from '~/app-routes.const';
import { ButtonMenuComponent } from '~/components/button-menu/button-menu.component';
import { LocaleSwitcherComponent } from '~/components/locale-switcher/locale-switcher.component';
import { LogoComponent } from '~/components/logo/logo.component';
import { HealthWidgetComponent } from '~/components/page-layout/components/health-widget/health-widget.component';
import { AuthService } from '~/services/auth.service';
import { RtlHelperService } from '~/services/rtl-helper.service';

@Component({
  selector: 'app-header',
  imports: [
    ButtonModule,
    AutoFocusModule,
    ToolbarModule,
    MenuModule,
    DrawerModule,
    FocusTrapModule,
    FormsModule,
    LogoComponent,
    HealthWidgetComponent,
    LocaleSwitcherComponent,
    ButtonMenuComponent,
    RouterLink,
    RouterLinkActive,
  ],
  providers: [],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  readonly AppRoutes = AppRoutes;

  private authService = inject(AuthService);
  readonly rtlHelper = inject(RtlHelperService);

  readonly programId = input<string>();

  readonly userName = computed(() => this.authService.user?.username);

  readonly userMenuOptions = computed<MenuItem[]>(() => [
    {
      label: $localize`:Menu-item:Change password`,
      icon: 'pi pi-key',
      routerLink: `/${AppRoutes.changePassword}`,
      visible: !!this.authService.ChangePasswordComponent,
    },
    {
      label: $localize`:Menu-item:Logout`,
      icon: 'pi pi-sign-out',
      command: () => {
        void this.authService.logout();
      },
    },
  ]);

  readonly sidebarVisible = model(false);

  readonly sidebarLinks = computed(() => {
    const links = [
      {
        label: $localize`:@@page-title-all-programs:All programs`,
        routerLink: `/${AppRoutes.programs}`,
      },
    ];

    if (!this.authService.isOrganizationAdmin) {
      return links;
    }

    return [
      ...links,
      {
        label: $localize`:@@page-title-users:Users`,
        routerLink: `/${AppRoutes.users}`,
      },
      {
        label: $localize`:@@page-title-user-roles:User roles`,
        routerLink: `/${AppRoutes.userRoles}`,
      },
    ];
  });
}
