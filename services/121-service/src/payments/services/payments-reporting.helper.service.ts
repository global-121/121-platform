import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { NedbankVoucherEntity } from '@121-service/src/payments/fsp-integration/nedbank/entities/nedbank-voucher.entity';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { ProjectRegistrationAttributeRepository } from '@121-service/src/projects/repositories/project-registration-attribute.repository';
import {
  DefaultRegistrationDataAttributeNames,
  GenericRegistrationAttributes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { EntityClass } from '@121-service/src/shared/types/entity-class.type';

@Injectable()
export class PaymentsReportingHelperService {
  @InjectRepository(ProjectEntity)
  private readonly projectRepository: Repository<ProjectEntity>;

  public constructor(
    private readonly projectRegistrationAttributeRepository: ProjectRegistrationAttributeRepository,
  ) {}

  public async getSelectForExport(projectId: number): Promise<string[]> {
    return [
      ...(await this.getDefaultSelect({ projectId })),
      ...(await this.getProjectAttributeNamesIncludedInExport(projectId)),
    ];
  }

  private async getProjectAttributeNamesIncludedInExport(
    projectId: number,
  ): Promise<string[]> {
    const projectRegistrationAttributes =
      await this.projectRegistrationAttributeRepository.find({
        where: {
          projectId: Equal(projectId),
          includeInTransactionExport: Equal(true),
        },
      });

    return projectRegistrationAttributes.map((attr) => attr.name);
  }

  private async getDefaultSelect({
    projectId,
  }: {
    projectId: number;
  }): Promise<string[]> {
    const defaultSelect = [
      DefaultRegistrationDataAttributeNames.name,
      GenericRegistrationAttributes.registrationProjectId,
      GenericRegistrationAttributes.phoneNumber,
      GenericRegistrationAttributes.preferredLanguage,
      GenericRegistrationAttributes.paymentAmountMultiplier,
      GenericRegistrationAttributes.projectFspConfigurationLabel,
      GenericRegistrationAttributes.paymentCount,
    ];

    const project = await this.projectRepository.findOneByOrFail({
      id: projectId,
    });

    if (project.enableMaxPayments) {
      defaultSelect.push(GenericRegistrationAttributes.maxPayments);
    }

    if (project.enableScope) {
      defaultSelect.push(GenericRegistrationAttributes.scope);
    }

    return defaultSelect;
  }

  public async getFspSpecificJoinFields(projectId: number): Promise<
    {
      entityJoinedToTransaction: EntityClass<any>;
      attribute: string;
      alias: string;
    }[]
  > {
    const project = await this.projectRepository.findOneOrFail({
      where: { id: Equal(projectId) },
      relations: ['projectFspConfigurations'],
    });
    let fields: {
      entityJoinedToTransaction: EntityClass<any>;
      attribute: string;
      alias: string;
    }[] = [];

    for (const fspConfig of project.projectFspConfigurations) {
      if (fspConfig.fspName === Fsps.safaricom) {
        fields = [
          ...fields,
          ...[
            {
              entityJoinedToTransaction: SafaricomTransferEntity,
              attribute: 'mpesaTransactionId',
              alias: 'mpesaTransactionId',
            },
          ],
        ];
      }
      if (fspConfig.fspName === Fsps.nedbank) {
        fields = [
          ...fields,
          ...[
            {
              entityJoinedToTransaction: NedbankVoucherEntity, //TODO: should we move this to fsps-settings.const.ts?
              attribute: 'status',
              alias: 'nedbankVoucherStatus',
            },
            {
              entityJoinedToTransaction: NedbankVoucherEntity, //TODO: should we move this to fsps-settings.const.ts?
              attribute: 'orderCreateReference',
              alias: 'nedbankOrderCreateReference',
            },
            {
              entityJoinedToTransaction: NedbankVoucherEntity, //TODO: should we move this to fsps-settings.const.ts?
              attribute: 'paymentReference',
              alias: 'nedbankPaymentReference',
            },
          ],
        ];
      }
    }
    return fields;
  }

  public createTransactionsExportFilename(
    projectId: number,
    fromDate?: Date,
    toDate?: Date,
    payment?: number,
  ): string {
    const formatDateForFilename = (date?: Date) =>
      date ? date.toISOString().slice(0, 19).replace(/:/g, '-') : undefined;
    const fromDateString = fromDate
      ? formatDateForFilename(fromDate)
      : undefined;
    const toDateString = toDate ? formatDateForFilename(toDate) : undefined;
    const paymentString = payment ? `payment_${payment}` : undefined;
    const fileNameParts = [
      `transactions_${projectId}`,
      fromDateString,
      toDateString,
      paymentString,
    ].filter(Boolean);

    return fileNameParts.join('_');
  }
}
