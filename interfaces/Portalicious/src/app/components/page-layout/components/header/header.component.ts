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
import { HealthWidgetComponent } from '~/components/health-widget/health-widget.component';
import { LanguageSwitcherComponent } from '~/components/language-switcher/language-switcher.component';
import { LogoComponent } from '~/components/logo/logo.component';
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
  ],
  providers: [],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private authService = inject(AuthService);
  projectId = input<string>();

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

  sidebarLinks = [
    {
      label: $localize`:Menu-item:All projects`,
      routerLink: `/${AppRoutes.projects}`,
    },
    {
      label: $localize`:Menu-item:Users`,
      routerLink: `/${AppRoutes.users}`,
    },
    {
      label: $localize`:Menu-item:Roles and permissions`,
      routerLink: `/${AppRoutes.rolesAndPermissions}`,
    },
  ];
}
