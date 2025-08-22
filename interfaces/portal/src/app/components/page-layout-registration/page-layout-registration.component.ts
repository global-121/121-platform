import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';
import { MenuItem } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MenuModule } from 'primeng/menu';

import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { PermissionEnum } from '@121-service/src/user/enum/permission.enum';

import { AppRoutes } from '~/app.routes';
import { ButtonMenuComponent } from '~/components/button-menu/button-menu.component';
import { ColoredChipComponent } from '~/components/colored-chip/colored-chip.component';
import {
  getChipDataByDuplicateStatus,
  getChipDataByRegistrationStatus,
} from '~/components/colored-chip/colored-chip.helper';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { PageLayoutComponent } from '~/components/page-layout/page-layout.component';
import { AddNoteFormComponent } from '~/components/page-layout-registration/components/add-note-form/add-note-form.component';
import { IgnoreDuplicationDialogComponent } from '~/components/page-layout-registration/components/ignore-duplicates-dialog/ignore-duplication-dialog.component';
import { RegistrationDuplicatesBannerComponent } from '~/components/page-layout-registration/components/registration-duplicates-banner/registration-duplicates-banner.component';
import { RegistrationMenuComponent } from '~/components/page-layout-registration/components/registration-menu/registration-menu.component';
import { SkeletonInlineComponent } from '~/components/skeleton-inline/skeleton-inline.component';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { RegistrationApiService } from '~/domains/registration/registration.api.service';
import { RegistrationStatusChangeTarget } from '~/domains/registration/registration.model';
import { ChangeStatusDialogComponent } from '~/pages/project-registrations/components/change-status-dialog/change-status-dialog.component';
import { SendMessageDialogComponent } from '~/pages/project-registrations/components/send-message-dialog/send-message-dialog.component';
import { AuthService } from '~/services/auth.service';
import { PaginateQueryService } from '~/services/paginate-query.service';
import { RegistrationActionMenuService } from '~/services/registration-action-menu.service';
import { RegistrationLookupService } from '~/services/registration-lookup.service';
import { TranslatableStringService } from '~/services/translatable-string.service';

@Component({
  selector: 'app-page-layout-registration',
  imports: [
    PageLayoutComponent,
    ButtonMenuComponent,
    CardModule,
    DataListComponent,
    ButtonModule,
    DatePipe,
    MenuModule,
    SkeletonInlineComponent,
    AddNoteFormComponent,
    RegistrationMenuComponent,
    RegistrationDuplicatesBannerComponent,
    ColoredChipComponent,
    SendMessageDialogComponent,
    ChangeStatusDialogComponent,
    IgnoreDuplicationDialogComponent,
  ],
  templateUrl: './page-layout-registration.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageLayoutRegistrationComponent {
  readonly projectId = input.required<string>();
  readonly registrationId = input.required<string>();

  private authService = inject(AuthService);
  readonly projectApiService = inject(ProjectApiService);
  readonly registrationApiService = inject(RegistrationApiService);
  readonly registrationLookupService = inject(RegistrationLookupService);
  readonly translatableStringService = inject(TranslatableStringService);
  private registrationMenuService = inject(RegistrationActionMenuService);
  private paginateQueryService = inject(PaginateQueryService);

  readonly sendMessageDialog =
    viewChild.required<SendMessageDialogComponent>('sendMessageDialog');
  readonly changeStatusDialog =
    viewChild.required<ChangeStatusDialogComponent>('changeStatusDialog');
  readonly ignoreDuplicationDialog =
    viewChild.required<IgnoreDuplicationDialogComponent>(
      'ignoreDuplicationDialog',
    );

  project = injectQuery(this.projectApiService.getProject(this.projectId));
  registration = injectQuery(
    this.registrationApiService.getRegistrationById(
      this.projectId,
      this.registrationId,
    ),
  );

  readonly addNoteFormVisible = signal(false);
  readonly actionMenuItems = computed<MenuItem[]>(() => [
    {
      // We need to provide a label for this submenu header due to a PrimeNG bug.
      // Without a label, PrimeNG adds unwanted whitespace in the menu rendering.
      // See discussion: https://github.com/global-121/121-platform/pull/6541#discussion_r1975162183 on out github which also links to the bug in primeNG
      label: $localize`:@@general:General`,
      items: [
        {
          label: $localize`:@@add-note:Add note`,
          icon: 'pi pi-pen-to-square',
          command: () => {
            this.addNoteFormVisible.set(true);
          },
          visible: this.canUpdatePersonalData(),
        },
        this.registrationMenuService.createContextItemForMessage({
          projectId: this.projectId(),
          command: () => {
            this.sendMessage();
          },
        }),
      ],
    },
    {
      label: $localize`Status update`,
      items: [
        this.createContextItemForRegistrationStatusChange(
          RegistrationStatusEnum.validated,
        ),
        this.createContextItemForRegistrationStatusChange(
          RegistrationStatusEnum.included,
        ),
        this.createContextItemForRegistrationStatusChange(
          RegistrationStatusEnum.declined,
        ),
        this.createContextItemForRegistrationStatusChange(
          RegistrationStatusEnum.paused,
        ),
        this.createContextItemForRegistrationStatusChange(
          RegistrationStatusEnum.deleted,
        ),
      ],
    },
    {
      label: $localize`:@@registration-duplicates:Duplicates`,
      items: [
        {
          label: $localize`:@@ignore-duplication:Ignore duplication`,
          icon: 'pi pi-clone',
          visible:
            this.canIgnoreDuplication() &&
            this.registration.data()?.duplicateStatus ===
              DuplicateStatus.duplicate,
          command: () => {
            this.ignoreDuplicationDialog().show();
          },
        },
      ],
    },
  ]);

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

  readonly canViewPersonalData = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.RegistrationPersonalREAD,
    }),
  );
  readonly canUpdatePersonalData = computed(() =>
    this.authService.hasPermission({
      projectId: this.projectId(),
      requiredPermission: PermissionEnum.RegistrationPersonalUPDATE,
    }),
  );

  readonly canIgnoreDuplication = computed(() =>
    this.authService.hasAllPermissions({
      projectId: this.projectId(),
      requiredPermissions: [
        PermissionEnum.RegistrationPersonalUPDATE,
        PermissionEnum.RegistrationDuplicationDELETE,
      ],
    }),
  );

  readonly duplicateChipData = computed(() =>
    getChipDataByDuplicateStatus(this.registration.data()?.duplicateStatus),
  );

  sendMessage() {
    const registration = this.registration.data();
    if (!registration) {
      return;
    }
    const actionData = this.paginateQueryService.singleItemToActionData({
      item: registration,
      fieldForFilter: GenericRegistrationAttributes.referenceId,
    });
    this.sendMessageDialog().triggerAction(actionData);
  }

  changeStatus({ status }: { status: RegistrationStatusEnum }) {
    const registration = this.registration.data();
    if (!registration) {
      return;
    }
    const actionData = this.paginateQueryService.singleItemToActionData({
      item: registration,
      fieldForFilter: GenericRegistrationAttributes.referenceId,
    });
    this.changeStatusDialog().triggerAction(actionData, status);
  }

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

  private createContextItemForRegistrationStatusChange(
    status: RegistrationStatusChangeTarget,
  ) {
    return this.registrationMenuService.createContextItemForRegistrationStatusChange(
      {
        status,
        projectId: this.projectId(),
        hasValidation: this.project.data()?.validation ?? false,
        command: () => {
          this.changeStatus({
            status,
          });
        },
      },
    );
  }
}
