import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { TabMenuModule } from 'primeng/tabmenu';
import { AppRoutes } from '~/app.routes';

@Component({
  selector: 'app-project-header',
  standalone: true,
  imports: [TabMenuModule],
  templateUrl: './project-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramHeaderComponent {
  programId = input.required<string>();

  navMenuItems = computed(() => [
    {
      label: $localize`Overview`,
      routerLink: `/${AppRoutes.project}/${this.programId()}/${AppRoutes.projectOverview}`,
    },
    {
      label: $localize`Team`,
      routerLink: `/${AppRoutes.project}/${this.programId()}/${AppRoutes.projectTeam}`,
    },
    {
      label: $localize`Registrations`,
      routerLink: `/${AppRoutes.project}/${this.programId()}/${AppRoutes.projectRegistrations}`,
    },
    {
      label: $localize`Payments`,
      routerLink: `/${AppRoutes.project}/${this.programId()}/${AppRoutes.projectPayments}`,
    },
    {
      label: $localize`Monitoring`,
      routerLink: `/${AppRoutes.project}/${this.programId()}/${AppRoutes.projectMonitoring}`,
    },
  ]);
}
