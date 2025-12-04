import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { InjectRepository } from '@nestjs/typeorm';
import { Equal, Repository } from 'typeorm';

import { Fsps } from '@121-service/src/fsp-management/enums/fsp-name.enum';
import { NedbankVoucherEntity } from '@121-service/src/payments/fsp-integration/nedbank/entities/nedbank-voucher.entity';
import { SafaricomTransferEntity } from '@121-service/src/payments/fsp-integration/safaricom/entities/safaricom-transfer.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { ProgramRegistrationAttributeRepository } from '@121-service/src/programs/repositories/program-registration-attribute.repository';
import {
  DefaultRegistrationDataAttributeNames,
  GenericRegistrationAttributes,
} from '@121-service/src/registration/enum/registration-attribute.enum';
import { EntityClass } from '@121-service/src/shared/types/entity-class.type';

@Injectable()
export class PaymentsReportingHelperService {
  @InjectRepository(ProgramEntity)
  private readonly programRepository: Repository<ProgramEntity>;

  public constructor(
    private readonly programRegistrationAttributeRepository: ProgramRegistrationAttributeRepository,
  ) {}

  public async getSelectForExport(programId: number): Promise<string[]> {
    return [
      ...(await this.getDefaultSelect({ programId })),
      ...(await this.getProgramAttributeNamesIncludedInExport(programId)),
    ];
  }

  private async getProgramAttributeNamesIncludedInExport(
    programId: number,
  ): Promise<string[]> {
    const programRegistrationAttributes =
      await this.programRegistrationAttributeRepository.find({
        where: {
          programId: Equal(programId),
          includeInTransactionExport: Equal(true),
        },
      });

    return programRegistrationAttributes.map((attr) => attr.name);
  }

  private async getDefaultSelect({
    programId,
  }: {
    programId: number;
  }): Promise<string[]> {
    const defaultSelect = [
      DefaultRegistrationDataAttributeNames.name,
      GenericRegistrationAttributes.registrationProgramId,
      GenericRegistrationAttributes.phoneNumber,
      GenericRegistrationAttributes.preferredLanguage,
      GenericRegistrationAttributes.paymentAmountMultiplier,
      GenericRegistrationAttributes.programFspConfigurationLabel,
      GenericRegistrationAttributes.paymentCount,
    ];

    const program = await this.programRepository.findOneByOrFail({
      id: programId,
    });

    if (program.enableMaxPayments) {
      defaultSelect.push(GenericRegistrationAttributes.maxPayments);
    }

    if (program.enableScope) {
      defaultSelect.push(GenericRegistrationAttributes.scope);
    }

    return defaultSelect;
  }

  public async getFspSpecificJoinFields(programId: number): Promise<
    {
      entityJoinedToTransaction: EntityClass<any>;
      attribute: string;
      alias: string;
    }[]
  > {
    const program = await this.programRepository.findOneOrFail({
      where: { id: Equal(programId) },
      relations: ['programFspConfigurations'],
    });
    let fields: {
      entityJoinedToTransaction: EntityClass<any>;
      attribute: string;
      alias: string;
    }[] = [];

    for (const fspConfig of program.programFspConfigurations) {
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
    programId: number,
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
      `transactions_${programId}`,
      fromDateString,
      toDateString,
      paymentString,
    ].filter(Boolean);

    return fileNameParts.join('_');
  }
}
