import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { FocusTrapModule } from 'primeng/focustrap';
import { MenuModule } from 'primeng/menu';
import { SidebarModule } from 'primeng/sidebar';
import { ToolbarModule } from 'primeng/toolbar';

import { AppRoutes } from '~/app.routes';
import { ButtonMenuComponent } from '~/components/button-menu/button-menu.component';
import { LanguageSwitcherComponent } from '~/components/language-switcher/language-switcher.component';
import { LogoComponent } from '~/components/logo/logo.component';
import { HealthWidgetComponent } from '~/components/page-layout/components/health-widget/health-widget.component';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    ButtonModule,
    ToolbarModule,
    MenuModule,
    SidebarModule,
    FocusTrapModule,
    DropdownModule,
    FormsModule,
    LogoComponent,
    HealthWidgetComponent,
    LanguageSwitcherComponent,
    ButtonMenuComponent,
  ],
  providers: [],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private authService = inject(AuthService);
  projectId = input<number>();

  userName = computed(() => this.authService.user?.username);

  userMenuOptions = [
    {
      label: $localize`:Menu-item:Change password`,
      icon: 'pi pi-cog',
      routerLink: `/${AppRoutes.changePassword}`,
    },
    {
      label: $localize`:Menu-item:Logout`,
      icon: 'pi pi-sign-out',
      command: () => {
        void this.authService.logout();
      },
    },
  ];

  sidebarVisible = false;

  sidebarLinks = computed(() => {
    const links = [
      {
        label: $localize`:@@page-title-all-projects:All projects`,
        routerLink: `/${AppRoutes.projects}`,
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
