import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MenuItem } from 'primeng/api';
import { CardModule } from 'primeng/card';
import { TabMenuModule } from 'primeng/tabmenu';
import { AppRoutes } from '~/app.routes';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';

@Component({
  selector: 'app-registration-header',
  standalone: true,
  imports: [TabMenuModule, CardModule, DataListComponent],
  templateUrl: './registration-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationHeaderComponent {
  projectId = input.required<number>();
  registrationId = input.required<number>();

  items: MenuItem[] = [
    { label: 'Activity log', icon: 'pi pi-list', route: './activity-log' },
    {
      label: 'Personal information',
      icon: 'pi pi-id-card',
      route: './personal-information',
    },
    { label: 'Debit cards', icon: 'pi pi-credit-card', route: './debit-cards' },
  ];

  navMenuItems = computed<MenuItem[]>(() => [
    {
      label: $localize`:@@page-title-project-registrations:Activity-log`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectRegistrations}/${this.registrationId().toString()}/activity-log`,
      icon: 'pi pi-list',
    },
    {
      label: $localize`:@@page-title-project-registrations:Personal-information`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectRegistrations}/${this.registrationId().toString()}/personal-information`,
      icon: 'pi pi-card',
    },
    {
      label: $localize`:@@page-title-project-registrations:Debit-cards`,
      routerLink: `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectRegistrations}/${this.registrationId().toString()}/debit-cards`,
      icon: 'pi pi-credit-card',
      // TODO: This should check if the current program has FSP Visa
      // visible: this.authService.hasPermission(
      //   this.projectId(),
      //   PermissionEnum.AidWorkerProgramREAD,
      // ),
    },
  ]);

  registrationGeneralDetails = computed(() => {
    const data: DataListItem[] = [
      {
        label: $localize`:@@registration-status:Status`,
        value: 'Registered',
        type: 'text',
      },
      {
        label: $localize`:@@registration-payments:Payments`,
        value: '6 out of 12',
        type: 'text',
      },
      {
        label: $localize`:@@registration-phone-number:Phone number`,
        value: '+31612345678',
        type: 'text',
      },
      {
        label: $localize`:@@registration-scope:Scope`,
        value: 'utrecht',
        type: 'text',
      },
    ];
    return data;
  });
}
