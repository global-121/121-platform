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

import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { getChipDataByRegistrationStatus } from '~/components/colored-chip/colored-chip.helper';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { AddNoteFormComponent } from '~/components/registration-page-layout/components/add-note-form/add-note-form.component';
import { RegistrationMenuComponent } from '~/components/registration-page-layout/components/registration-menu/registration-menu.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { AuthService } from '~/services/auth.service';
import { RegistrationLookupService } from '~/services/registration-lookup.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-registration-page-layout',
  imports: [
    PageLayoutComponent,
    CardModule,
    DataListComponent,
    ButtonModule,
    DatePipe,
    SkeletonInlineComponent,
    AddNoteFormComponent,
    RegistrationMenuComponent,
  ],
  templateUrl: './registration-page-layout.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrationPageLayoutComponent {
  readonly projectId = input.required<string>();
  readonly registrationId = input.required<string>();

  private authService = inject(AuthService);
  readonly projectApiService = inject(ProjectApiService);
  readonly registrationApiService = inject(RegistrationApiService);
  readonly registrationLookupService = inject(RegistrationLookupService);
  readonly translatableStringService = inject(TranslatableStringService);

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );

  readonly registrationData = computed(() => {
    const registrationRawData = this.registration.data();
    const { chipLabel, chipVariant } = getChipDataByRegistrationStatus(
      registrationRawData?.status,
    );

    const listData: DataListItem[] = [
      {
        label: $localize`:@@registration-status:Registration Status`,
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

    return listData.map((item) => ({
      ...item,
      loading: this.registration.isPending(),
    }));
  });

  readonly parentLink = computed(() =>
    this.registrationLookupService.isActive()
      ? undefined
      : [
          '/',
          AppRoutes.project,
          this.projectId(),
          AppRoutes.projectRegistrations,
        ],
  );

  readonly parentTitle = computed(() =>
    this.registrationLookupService.isActive()
      ? this.translatableStringService.translate(
          this.project.data()?.titlePortal,
        )
      : $localize`All Registrations`,
  );

  readonly registrationTitle = computed(() => {
    const localized = $localize`Reg. #`;

    return `${localized}${this.registration.data()?.registrationProgramId.toString() ?? ''} - ${this.registration.data()?.name ?? ''}`;
  });

  readonly addNoteFormVisible = signal(false);

  readonly canUpdatePersonalData = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.RegistrationPersonalUPDATE,
    }),
  );
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
}
