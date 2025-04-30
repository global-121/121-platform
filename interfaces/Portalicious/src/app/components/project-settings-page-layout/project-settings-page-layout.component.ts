import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';

import { AppRoutes } from '~/app.routes';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { ProjectApiService } from '~/domains/project/project.api.service';

@Component({
  selector: 'app-project-settings-page-layout',
  imports: [PageLayoutComponent, RouterLink, RouterLinkActive],
  templateUrl: './project-settings-page-layout.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectSettingsPageLayoutComponent {
  readonly projectId = input.required<string>();

  readonly projectApiService = inject(ProjectApiService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));

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
    },
    {
      label: $localize`FSP`,
      icon: 'pi pi-money-bill',
      routerLink: [
        '/',
        AppRoutes.project,
        this.projectId(),
        AppRoutes.projectSettings,
        AppRoutes.projectSettingsFinancialServiceProviders,
      ],
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
    },
    {
      label: $localize`Layouts`,
      icon: 'pi pi-table',
      routerLink: [
        '/',
        AppRoutes.project,
        this.projectId(),
        AppRoutes.projectSettings,
        AppRoutes.projectSettingsLayouts,
      ],
    },
  ]);
}
