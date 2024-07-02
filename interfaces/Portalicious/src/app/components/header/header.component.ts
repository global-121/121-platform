import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  model,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DropdownModule } from 'primeng/dropdown';
import { MenuModule } from 'primeng/menu';
import { SidebarModule } from 'primeng/sidebar';
import { ToolbarModule } from 'primeng/toolbar';
import { ToastService } from '../../services/toast.service';

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
  ],
  providers: [ToastService],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private toastService = inject(ToastService);

  sidebarVisible = false;
  userMenuOptions = [
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => {
        this.toastService.showToast({
          detail: 'You clicked on Settings!',
        });
      },
    },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: () => {
        this.toastService.showToast({
          detail: 'You clicked on Log Out!',
        });
      },
    },
  ];

  sidebarLinks = [
    {
      label: 'Home',
      routerLink: '/',
    },
    {
      label: 'About',
      routerLink: '/',
    },
    {
      label: 'Contact',
      routerLink: '/',
    },
  ];

  selectedLanguage = model('en');
  selectedLanguageLabel = computed(() => {
    return this.languages.find((lang) => lang.value === this.selectedLanguage())
      ?.label;
  });

  languages = [
    { label: 'اللغة العربية', value: 'ar' },
    { label: 'Türkçe', value: 'tr' },
    { label: 'Nederlands', value: 'nl' },
    { label: 'English', value: 'en' },
  ];
}
