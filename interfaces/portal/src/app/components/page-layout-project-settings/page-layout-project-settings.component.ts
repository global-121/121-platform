import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { MenuItem } from 'primeng/api';

import { AppRoutes } from '~/app.routes';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';

@Component({
  selector: 'app-page-layout-project-settings',
  imports: [PageLayoutComponent, RouterLink, RouterLinkActive],
  templateUrl: './page-layout-project-settings.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutProjectSettingsComponent {
  readonly projectId = input.required<string>();

  readonly menuItems = computed<MenuItem[]>(() => [
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
    },
  ]);
}
