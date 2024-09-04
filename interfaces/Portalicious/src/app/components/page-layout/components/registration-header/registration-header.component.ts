import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TabMenuModule } from 'primeng/tabmenu';
import { AppRoutes } from '~/app.routes';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';

@Component({
  selector: 'app-registration-header',
  standalone: true,
  imports: [TabMenuModule, CardModule, DataListComponent, ButtonModule],
  templateUrl: './registration-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationHeaderComponent {
  readonly registrationApiService = inject(RegistrationApiService);

  projectId = input.required<number>();
  registrationId = input.required<number>();
  registration = injectQuery(
    this.registrationApiService.getReferenceIdByRegistrationId(
      this.projectId,
      this.registrationId,
    ),
  );

  registrationData = computed(() => {
    const registrationRawData = this.registration.data();
    const listData: DataListItem[] = [
      {
        label: $localize`:@@registration-status:Status`,
        value: '01-01-2024',
        type: 'date',
        chipLabel: registrationRawData?.registrationStatus?.toString(),
        // TODO: Make helper to determine the variant based on status
        chipVariant: 'green',
      },
      {
        label: $localize`:@@registration-phone-number:Phone number`,
        value: registrationRawData?.phoneNumber,
        type: 'text',
      },
      {
        label: $localize`:@@registration-payments:Payments`,
        value: this.getPaymentCountString(
          registrationRawData?.paymentCount,
          registrationRawData?.maxPayments,
        ),
        type: 'text',
      },
      {
        label: $localize`:@@registration-scope:Scope`,
        value: registrationRawData?.scope,
        type: 'text',
      },
    ];

    return listData.map((item) => ({
      ...item,
      loading: this.registration.isPending(),
    }));
  });

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

  public openAddNoteDialog() {
    console.log('open dialog');
  }

  private getPaymentCountString(
    paymentCount?: null | number,
    maxPayments?: null | number,
  ): string | undefined {
    if (paymentCount != null && !maxPayments) {
      return paymentCount.toString();
    } else if (paymentCount != null && maxPayments != null) {
      return `${paymentCount.toString()} (out of ${maxPayments.toString()})`;
    } else {
      return;
    }
  }
}
