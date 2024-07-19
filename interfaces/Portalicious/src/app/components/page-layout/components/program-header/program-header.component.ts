import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { TabMenuModule } from 'primeng/tabmenu';
import { AppRoutes } from '~/app.routes';

@Component({
  selector: 'app-program-header',
  standalone: true,
  imports: [TabMenuModule],
  templateUrl: './program-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgramHeaderComponent {
  programId = input.required<string>();

  navMenuItems = computed(() => [
    {
      label: $localize`Overview`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programOverview}`,
    },
    {
      label: $localize`Team`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programTeam}`,
    },
    {
      label: $localize`Registrations`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programRegistrations}`,
    },
    {
      label: $localize`Payments`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programPayments}`,
    },
    {
      label: $localize`Monitoring`,
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programMonitoring}`,
    },
  ]);
}
