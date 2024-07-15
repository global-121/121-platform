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
      label: 'Overview',
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programOverview}`,
    },
    {
      label: 'Team',
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programTeam}`,
    },
    {
      label: 'Registrations',
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programRegistrations}`,
    },
    {
      label: 'Payments',
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programPayments}`,
    },
    {
      label: 'Monitoring',
      routerLink: `/${AppRoutes.program}/${this.programId()}/${AppRoutes.programMonitoring}`,
    },
  ]);
}
