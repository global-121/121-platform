import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from '@angular/core';

import { injectQuery } from '@tanstack/angular-query-experimental';

import { ActivityTypeEnum } from '@121-service/src/activities/enum/activity-type.enum';
import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';

import { getChipDataByRegistrationStatus } from '~/components/colored-chip/colored-chip.helper';
import {
  DataListComponent,
  DataListItem,
} from '~/components/data-list/data-list.component';
import { TableCellComponent } from '~/components/query-table/components/table-cell/table-cell.component';
import {
  FSPS_WITH_VOUCHER_SUPPORT,
  paymentLink,
} from '~/domains/payment/payment.helpers';
import { ProjectApiService } from '~/domains/project/project.api.service';
import { Activity } from '~/domains/registration/registration.model';
import { ActivityLogTableCellContext } from '~/pages/project-registration-activity-log/project-registration-activity-log.page';
import { RegistrationAttributeService } from '~/services/registration-attribute.service';

@Component({
  selector: 'app-activity-log-expanded-row',
  imports: [DataListComponent],
  templateUrl: './activity-log-expanded-row.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogExpandedRowComponent
  implements TableCellComponent<Activity, ActivityLogTableCellContext>
{
  private locale = inject(LOCALE_ID);
  private readonly projectApiService = inject(ProjectApiService);
  private readonly registrationAttributeService = inject(
    RegistrationAttributeService,
  );

  readonly value = input.required<Activity>();
  readonly context = input.required<ActivityLogTableCellContext>();

  registrationAttributes = injectQuery(
    this.registrationAttributeService.getRegistrationAttributes(this.context),
  );

  intersolveVoucherBalance = injectQuery(() => ({
    ...this.projectApiService.getIntersolveVoucherBalance({
      projectId: this.context().projectId,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guaranteed by enabled
      registrationReferenceId: this.context().referenceId!,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- guaranteed by enabled
      paymentId: this.paymentId()!,
    })(),
    enabled: () =>
      this.isIntersolveVoucher() &&
      !!this.context().referenceId &&
      !!this.paymentId(),
  }));

  readonly isIntersolveVoucher = computed(() => {
    const activity = this.value();

    return (
      activity.type === ActivityTypeEnum.Transaction &&
      FSPS_WITH_VOUCHER_SUPPORT.includes(activity.attributes.fspName)
    );
  });

  readonly paymentId = computed(() => {
    const activity = this.value();
    return activity.type === ActivityTypeEnum.Transaction
      ? activity.attributes.paymentId
      : undefined;
  });

  private localizeAttribute = (
    attributeName?: GenericRegistrationAttributes | string,
    attributeValue = '',
  ) =>
    this.registrationAttributeService.localizeAttribute({
      attributes: this.registrationAttributes.data(),
      attributeName,
      attributeOptionValue: attributeValue,
    });

  readonly dataList = computed<DataListItem[] | undefined>(() => {
    const { attributes, user, type } = this.value();
    switch (type) {
      case ActivityTypeEnum.DataChange:
        return [
          {
            label: $localize`Old data`,
            value: this.localizeAttribute(
              attributes.fieldName,
              attributes.oldValue,
            ),
          },
          {
            label: $localize`New data`,
            value: this.localizeAttribute(
              attributes.fieldName,
              attributes.newValue,
            ),
          },
          {
            label: $localize`Change reason`,
            value: attributes.reason,
          },
        ];
      case ActivityTypeEnum.FspChange:
        return [
          {
            label: $localize`Old FSP`,
            value: this.localizeAttribute(
              GenericRegistrationAttributes.projectFspConfigurationName,
              attributes.oldValue,
            ),
          },
          {
            label: $localize`New FSP`,
            value: this.localizeAttribute(
              GenericRegistrationAttributes.projectFspConfigurationName,
              attributes.newValue,
            ),
          },
          {
            label: $localize`Change reason`,
            value: attributes.reason,
          },
        ];
      case ActivityTypeEnum.StatusChange:
        return [
          {
            label: $localize`Old status`,
            ...getChipDataByRegistrationStatus(attributes.oldValue),
          },
          {
            label: $localize`New status`,
            ...getChipDataByRegistrationStatus(attributes.newValue),
          },
          {
            label: $localize`Change reason`,
            value: attributes.reason,
          },
        ];
      case ActivityTypeEnum.Transaction: {
        const list: DataListItem[] = [
          {
            label: $localize`Payment`,
            value: $localize`Go to payment page`,
            type: 'text',
            routerLink: paymentLink({
              projectId: this.context().projectId(),
              paymentId: attributes.paymentId,
            }),
          },
          {
            label: $localize`Transfer status updated`,
            value:
              new DatePipe(this.locale).transform(
                attributes.updatedDate,
                'short',
              ) ?? '',
            type: 'text',
          },
          {
            label: $localize`Approved by`,
            chipLabel: user.username,
            chipVariant: 'blue',
          },
          {
            label: $localize`FSP`,
            value: attributes.fspConfigurationLabel,
          },
          {
            label: $localize`Amount`,
            value: attributes.amount,
            type: 'currency',
            currencyCode: this.context().currencyCode(),
          },
        ];

        if (this.isIntersolveVoucher()) {
          list.push({
            label: $localize`Current balance`,
            value: this.intersolveVoucherBalance.data(),
            type: 'currency',
            currencyCode: this.context().currencyCode(),
            loading: this.intersolveVoucherBalance.isLoading(),
          });
        }

        if (
          attributes.errorMessage &&
          (attributes.status === TransactionStatusEnum.error ||
            attributes.status === TransactionStatusEnum.waiting)
        ) {
          list.push({
            label:
              attributes.status === TransactionStatusEnum.error
                ? $localize`Fail reason`
                : $localize`Pending reason`,
            value: attributes.errorMessage,
            type: 'text',
          });
        }

        return list;
      }
      case ActivityTypeEnum.IgnoredDuplicate:
        return [
          {
            label: $localize`Update reason`,
            value: attributes.reason,
            type: 'text',
          },
        ];
      default:
        return undefined;
    }
  });

  readonly message = computed<string | undefined>(() => {
    const { type, attributes } = this.value();

    switch (type) {
      case ActivityTypeEnum.Note:
        return attributes.text;
      case ActivityTypeEnum.Message:
        return this.getMessageBody(attributes.body, attributes.mediaUrl);
      default:
        return undefined;
    }
  });

  private getMessageBody(messageBody?: string, mediaUrl?: string): string {
    const imageString = $localize`(image)`;
    const message = messageBody ?? '';

    if (!mediaUrl) {
      return message;
    }

    if (!message) {
      return imageString;
    }

    return `${imageString}\n\n${message}`;
  }
}
