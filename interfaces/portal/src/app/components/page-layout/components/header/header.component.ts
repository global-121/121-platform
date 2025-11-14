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

import { MenuItem } from 'primeng/api';
import { AutoFocusModule } from 'primeng/autofocus';
import { ButtonModule } from 'primeng/button';
import { DrawerModule } from 'primeng/drawer';
import { FocusTrapModule } from 'primeng/focustrap';
import { MenuModule } from 'primeng/menu';
import { ToolbarModule } from 'primeng/toolbar';

import { AppRoutes } from '~/app.routes';
import { ButtonMenuComponent } from '~/components/button-menu/button-menu.component';
import { LanguageSwitcherComponent } from '~/components/language-switcher/language-switcher.component';
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
    LanguageSwitcherComponent,
    ButtonMenuComponent,
    RouterLink,
    RouterLinkActive,
  ],
  providers: [],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  AppRoutes = AppRoutes;
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
