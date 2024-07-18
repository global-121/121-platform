import {
  ChangeDetectionStrategy,
  Component,
  LOCALE_ID,
  computed,
  effect,
  inject,
  input,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { SidebarModule } from 'primeng/sidebar';
import { ToolbarModule } from 'primeng/toolbar';
import { AppRoutes } from '~/app.routes';
import { LogoComponent } from '~/components/logo/logo.component';
import { AuthService } from '~/services/auth.service';
import { Locale, changeLanguage, getLocaleLabel } from '~/utils/locale';
import { environment } from '~environment';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    ButtonModule,
    ToolbarModule,
    MenuModule,
    SidebarModule,
    DropdownModule,
    FormsModule,
    LogoComponent,
  ],
  providers: [],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private authService = inject(AuthService);
  programTitle = input<string>();

  userName = computed(() => this.authService.user?.username);

  sidebarVisible = false;
  userMenuOptions = [
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      routerLink: `/${AppRoutes.userSettings}`,
    },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: () => {
        void this.authService.logout();
      },
    },
  ];

  sidebarLinks = [
    {
      label: 'All projects',
      routerLink: `/${AppRoutes.allProjects}`,
    },
    {
      label: 'Users',
      routerLink: `/${AppRoutes.users}`,
    },
    {
      label: 'Roles and permissions',
      routerLink: `/${AppRoutes.rolesAndPermissions}`,
    },
  ];

  locale = inject<Locale>(LOCALE_ID);
  selectedLanguage = model(this.locale);
  selectedLanguageLabel = computed(() => {
    return this.languages.find((lang) => lang.value === this.selectedLanguage())
      ?.label;
  });

  languages = environment.locales.split(',').map((locale) => ({
    label: getLocaleLabel(locale as Locale),
    value: locale as Locale,
  }));

  constructor() {
    effect(() => {
      if (this.selectedLanguage() === this.locale) {
        return;
      }
      changeLanguage(this.selectedLanguage());
    });
  }
}
