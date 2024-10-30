import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SkeletonModule } from 'primeng/skeleton';
import { TabMenuModule } from 'primeng/tabmenu';

import { FinancialServiceProviderName } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { getChipDataByRegistrationStatus } from '~/components/colored-chip/colored-chip.helper';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { PageLayoutTitleAndActionsComponent } from '~/components/page-layout/components/page-layout-title-and-actions/page-layout-title-and-actions.component';
import { AddNoteFormComponent } from '~/components/page-layout/components/registration-header/add-note-form/add-note-form.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { AuthService } from '~/services/auth.service';

@Component({
  selector: 'app-registration-header',
  standalone: true,
  imports: [
    TabMenuModule,
    CardModule,
    DataListComponent,
    ButtonModule,
    DatePipe,
    SkeletonInlineComponent,
    SkeletonModule,
    AddNoteFormComponent,
    PageLayoutTitleAndActionsComponent,
  ],
  templateUrl: './registration-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationHeaderComponent {
  readonly registrationApiService = inject(RegistrationApiService);
  readonly projectApiService = inject(ProjectApiService);
  private authService = inject(AuthService);

  projectId = input.required<number>();
  registrationId = input.required<number>();
  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );
  referenceId = computed(() => this.registration.data()?.referenceId);
  walletWithCards = injectQuery(
    this.registrationApiService.getWalletWithCardsByReferenceId(
      this.projectId,
      this.referenceId,
    ),
  );
  project = injectQuery(this.projectApiService.getProject(this.projectId));

  registrationData = computed(() => {
    const registrationRawData = this.registration.data();
    const { chipLabel, chipVariant } = getChipDataByRegistrationStatus(
      registrationRawData?.status,
    );

    const listData: DataListItem[] = [
      {
        label: $localize`:@@registration-status:Status`,
        chipLabel,
        chipVariant,
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
    ];
    if (this.project.data()?.enableScope) {
      listData.push({
        label: $localize`:@@registration-scope:Scope`,
        value: registrationRawData?.scope,
        type: 'text',
      });
    }
    if (
      this.registration.data()?.financialServiceProvider ===
      FinancialServiceProviderName.intersolveVisa
    ) {
      listData.push({
        label: $localize`:@@debit-card-balance:Current balance`,
        value: this.walletWithCards.data()?.balance,
        type: 'currency',
      });
    }

    return listData.map((item) => ({
      ...item,
      loading: this.registration.isPending(),
    }));
  });

  allRegistrationsLink = computed(() => [
    `/${AppRoutes.project}/${this.projectId().toString()}/${AppRoutes.projectRegistrations}`,
  ]);

  addNoteFormVisible = signal(false);

  private getPaymentCountString(
    paymentCount?: null | number,
    maxPayments?: null | number,
  ): string | undefined {
    if (paymentCount == null) {
      return;
    }

    if (!maxPayments) {
      return paymentCount.toString();
    }

    return $localize`${paymentCount.toString()}:count: (out of ${maxPayments.toString()}:totalCount:)`;
  }

  canUpdatePersonalData = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.RegistrationPersonalUPDATE,
    }),
  );
}
