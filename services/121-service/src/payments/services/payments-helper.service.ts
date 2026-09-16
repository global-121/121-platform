import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Equal } from 'typeorm';

import { TransactionStatusEnum } from '@121-service/src/payments/transactions/enums/transaction-status.enum';
import { TransactionViewScopedRepository } from '@121-service/src/payments/transactions/repositories/transaction.view.scoped.repository';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { DuplicateStatus } from '@121-service/src/registration/enum/duplicate-status.enum';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';

@Injectable()
export class PaymentsHelperService {
  public constructor(
    private readonly programFspConfigurationRepository: ProgramFspConfigurationRepository,
    private readonly transactionViewScopedRepository: TransactionViewScopedRepository,
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly registrationsBulkService: RegistrationsBulkService,
  ) {}

  public async checkFspConfigurationsOrThrow(
    programId: number,
    programFspConfigurationNames: string[],
  ): Promise<void> {
    const validationResults = await Promise.all(
      programFspConfigurationNames.map((name) =>
        this.getFspConfigurationErrorMessage(programId, name),
      ),
    );
    const errorMessages = validationResults.filter(
      (result): result is string => result !== undefined,
    );
    if (errorMessages.length > 0) {
      throw new HttpException(errorMessages.join(', '), HttpStatus.BAD_REQUEST);
    }
  }

  private async getFspConfigurationErrorMessage(
    programId: number,
    programFspConfigurationName: string,
  ): Promise<string | undefined> {
    const config = await this.programFspConfigurationRepository.findOne({
      where: {
        name: Equal(programFspConfigurationName),
        programId: Equal(programId),
      },
    });

    if (!config) {
      return `Missing Program FSP configuration with name ${programFspConfigurationName}`;
    }

    if (config.state !== FspConfigurationStates.configured) {
      return `Program FSP configuration ${programFspConfigurationName} is not fully configured`;
    }

    return;
  }

  async throwIfPaymentHasDuplicateRegistrations({
    programId,
    paymentId,
    action,
  }: {
    programId: number;
    paymentId: number;
    action: 'approve' | 'start';
  }): Promise<void> {
    const transactionsForPayment =
      await this.transactionViewScopedRepository.getByStatusOfIncludedRegistrations(
        {
          programId,
          paymentId,
          transactionStatus: [
            TransactionStatusEnum.pendingApproval,
            TransactionStatusEnum.approved,
          ],
        },
      );

    const registrationIds = [
      ...new Set(transactionsForPayment.map((t) => t.registrationId)),
    ];
    if (registrationIds.length === 0) {
      return;
    }

    const duplicateRegistrations =
      await this.registrationsPaginationService.getRegistrationViewsNoLimit({
        programId,
        paginateQuery: {
          path: '',
          filter: {
            duplicateStatus: DuplicateStatus.duplicate,
          },
        },
        queryBuilder: this.registrationsBulkService
          .getBaseQuery()
          .andWhere('registration.id IN (:...registrationIds)', {
            registrationIds,
          }),
      });

    if (duplicateRegistrations.length > 0) {
      throw new HttpException(
        `Cannot ${action} payment: ${duplicateRegistrations.length} registration(s) have duplicate status. Resolve duplicates before ${action === 'approve' ? 'approving' : 'starting'} this payment.`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
