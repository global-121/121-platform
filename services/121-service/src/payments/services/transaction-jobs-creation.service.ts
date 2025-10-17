import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { FSP_SETTINGS } from '@121-service/src/fsps/fsp-settings.const';
import { ReferenceIdAndTransactionAmountInterface } from '@121-service/src/payments/interfaces/referenceid-transaction-amount.interface';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { AirtelTransactionJobDto } from '@121-service/src/transaction-queues/dto/airtel-transaction-job.dto';
import { CommercialBankEthiopiaTransactionJobDto } from '@121-service/src/transaction-queues/dto/commercial-bank-ethiopia-transaction-job.dto';
import { ExcelTransactionJobDto } from '@121-service/src/transaction-queues/dto/excel-transaction-job.dto';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { IntersolveVoucherTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-voucher-transaction-job.dto';
import { NedbankTransactionJobDto } from '@121-service/src/transaction-queues/dto/nedbank-transaction-job.dto';
import { OnafriqTransactionJobDto } from '@121-service/src/transaction-queues/dto/onafriq-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';
import { SharedTransactionJobDto } from '@121-service/src/transaction-queues/dto/shared-transaction-job.dto';
import { TransactionQueuesService } from '@121-service/src/transaction-queues/transaction-queues.service';
import { formatDateYYMMDD } from '@121-service/src/utils/formatDate';
import { generateRandomNumerics } from '@121-service/src/utils/random-value.helper';

@Injectable()
export class TransactionJobsCreationService {
  constructor(
    private readonly registrationsPaginationService: RegistrationsPaginationService,
    private readonly registrationsBulkService: RegistrationsBulkService,
    private readonly transactionQueuesService: TransactionQueuesService,
  ) {}

  /**
   * Generic method to create FSP-specific transaction jobs based on FSP name
   */
  public async createAndAddFspSpecificTransactionJobs({
    fspName,
    referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
  }: {
    fspName: string;
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    switch (fspName) {
      case Fsps.intersolveVisa:
        return await this.createAndAddIntersolveVisaTransactionJobs({
          referenceIdsTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
          fspName,
        });
      case Fsps.intersolveVoucherWhatsapp:
        return await this.createAndAddIntersolveVoucherTransactionJobs({
          referenceIdsTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
          fspName,
          useWhatsapp: true,
        });
      case Fsps.intersolveVoucherPaper:
        return await this.createAndAddIntersolveVoucherTransactionJobs({
          referenceIdsTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
          fspName,
          useWhatsapp: false,
        });
      case Fsps.safaricom:
        return await this.createAndAddSafaricomTransactionJobs({
          referenceIdsTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
          fspName,
        });
      case Fsps.airtel:
        return await this.createAndAddAirtelTransactionJobs({
          referenceIdsTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
          fspName,
        });
      case Fsps.nedbank:
        return await this.createAndAddNedbankTransactionJobs({
          referenceIdsTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
          fspName,
        });
      case Fsps.onafriq:
        return await this.createAndAddOnafriqTransactionJobs({
          referenceIdsTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
          fspName,
        });
      case Fsps.commercialBankEthiopia:
        return await this.createAndAddCommercialBankEthiopiaTransactionJobs({
          referenceIdsTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
          fspName,
        });
      case Fsps.excel:
        return await this.createAndAddExcelTransactionJobs({
          referenceIdsTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
          fspName,
        });
      default:
        // For FSPs that don't have a specific implementation
        console.log(`No specific transaction job handler for FSP: ${fspName}`);
        return;
    }
  }

  /**
   * Creates and adds Intersolve Visa transaction jobs.
   *
   * This method is responsible for creating transaction jobs for Intersolve Visa. It fetches necessary PA data and maps it to a FSP specific DTO.
   * It then adds these jobs to the transaction queue.
   *
   * @param {string[]} referenceIds - The reference IDs for the transaction jobs.
   * @param {number} programId - The ID of the program.
   * @param {number} paymentAmount - The amount to be transferred.
   * @param {number} paymentId - The payment number.
   * @param {boolean} isRetry - Whether this is a retry.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddIntersolveVisaTransactionJobs({
    referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
    fspName,
  }: {
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
    fspName: Fsps;
  }): Promise<void> {
    const { registrationViews, sharedJobsByReferenceId } =
      await this.createSharedJobs({
        referenceIdsTransactionAmounts,
        programId,
        paymentId,
        userId,
        isRetry,
        fspName,
      });

    const intersolveVisaTransactionJobs: IntersolveVisaTransactionJobDto[] =
      registrationViews.map(
        (registrationView): IntersolveVisaTransactionJobDto => {
          const base = sharedJobsByReferenceId.get(
            registrationView.referenceId,
          );
          return {
            ...base!,
            // FSP-specific additions:
            name: registrationView[FspAttributes.fullName]!, // Fullname is a required field if a registration has visa as FSP
            addressStreet: registrationView[FspAttributes.addressStreet],
            addressHouseNumber:
              registrationView[FspAttributes.addressHouseNumber],
            addressHouseNumberAddition:
              registrationView[FspAttributes.addressHouseNumberAddition],
            addressPostalCode:
              registrationView[FspAttributes.addressPostalCode],
            addressCity: registrationView[FspAttributes.addressCity],
            phoneNumber: registrationView.phoneNumber!, // Phonenumber is a required field if a registration has visa as FSP
          };
        },
      );

    await this.transactionQueuesService.addIntersolveVisaTransactionJobs(
      intersolveVisaTransactionJobs,
    );
  }

  /**
   * Creates and adds Intersolve Voucher transaction jobs.
   *
   * This method is responsible for creating transaction jobs for Intersolve Voucher. It fetches necessary PA data and maps it to a FSP specific DTO.
   * It then adds these jobs to the transaction queue.
   *
   * @param {string[]} referenceIds - The reference IDs for the transaction jobs.
   * @param {number} programId - The ID of the program.
   * @param {number} paymentAmount - The amount to be transferred.
   * @param {number} paymentId - The payment number.
   * @param {boolean} isRetry - Whether this is a retry.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddIntersolveVoucherTransactionJobs({
    referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
    useWhatsapp,
    fspName,
  }: {
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
    useWhatsapp: boolean;
    fspName: Fsps;
  }): Promise<void> {
    const { registrationViews, sharedJobsByReferenceId } =
      await this.createSharedJobs({
        referenceIdsTransactionAmounts,
        programId,
        paymentId,
        userId,
        isRetry,
        fspName,
      });

    const intersolveVoucherTransferJobs: IntersolveVoucherTransactionJobDto[] =
      registrationViews.map(
        (registrationView): IntersolveVoucherTransactionJobDto => {
          const base = sharedJobsByReferenceId.get(
            registrationView.referenceId,
          );
          return {
            ...base!,
            // FSP-specific additions:
            useWhatsapp,
            whatsappPhoneNumber: useWhatsapp
              ? registrationView[FspAttributes.whatsappPhoneNumber]!
              : null,
          };
        },
      );
    await this.transactionQueuesService.addIntersolveVoucherTransactionJobs(
      intersolveVoucherTransferJobs,
    );
  }

  /**
   * Creates and adds safaricom transaction jobs.
   *
   * This method is responsible for creating transaction jobs for Safaricom. It fetches necessary PA data and maps it to a FSP specific DTO.
   * It then adds these jobs to the transaction queue.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddSafaricomTransactionJobs({
    referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
    fspName,
  }: {
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
    fspName: Fsps;
  }): Promise<void> {
    const { registrationViews, sharedJobsByReferenceId } =
      await this.createSharedJobs({
        referenceIdsTransactionAmounts,
        programId,
        paymentId,
        userId,
        isRetry,
        fspName,
      });

    const safaricomTransferJobs: SafaricomTransactionJobDto[] =
      registrationViews.map((registrationView): SafaricomTransactionJobDto => {
        const base = sharedJobsByReferenceId.get(registrationView.referenceId);
        return {
          ...base!,
          // FSP-specific additions:
          phoneNumber: registrationView.phoneNumber!, // Phonenumber is a required field if a registration has safaricom as FSP
          idNumber: registrationView[FspAttributes.nationalId],
          originatorConversationId: uuid(), // REFACTOR: switch to nedbank/onafriq approach for idempotency key
        };
      });
    await this.transactionQueuesService.addSafaricomTransactionJobs(
      safaricomTransferJobs,
    );
  }

  /**
   * Creates and adds Airtel transaction jobs.
   *
   * This method is responsible for creating transaction jobs for Airtel. It fetches necessary PA data and maps it to a FSP specific DTO.
   * It then adds these jobs to the transaction queue.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddAirtelTransactionJobs({
    referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
    fspName,
  }: {
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
    fspName: Fsps;
  }): Promise<void> {
    const { registrationViews, sharedJobsByReferenceId } =
      await this.createSharedJobs({
        referenceIdsTransactionAmounts,
        programId,
        paymentId,
        userId,
        isRetry,
        fspName,
      });

    const airtelTransferJobs: AirtelTransactionJobDto[] = registrationViews.map(
      (registrationView): AirtelTransactionJobDto => {
        const base = sharedJobsByReferenceId.get(registrationView.referenceId);
        return {
          ...base!,
          // FSP-specific additions:
          phoneNumber: registrationView[FspAttributes.phoneNumber]!,
        };
      },
    );
    await this.transactionQueuesService.addAirtelTransactionJobs(
      airtelTransferJobs,
    );
  }

  /**
   * Creates and adds Nedbank transaction jobs.
   *
   * This method is responsible for creating transaction jobs for Nedbank. It fetches necessary PA data and maps it to a FSP specific DTO.
   * It then adds these jobs to the transaction queue.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddNedbankTransactionJobs({
    referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
    fspName,
  }: {
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
    fspName: Fsps;
  }): Promise<void> {
    const { registrationViews, sharedJobsByReferenceId } =
      await this.createSharedJobs({
        referenceIdsTransactionAmounts,
        programId,
        paymentId,
        userId,
        isRetry,
        fspName,
      });

    const nedbankTransferJobs: NedbankTransactionJobDto[] =
      registrationViews.map((registrationView): NedbankTransactionJobDto => {
        const base = sharedJobsByReferenceId.get(registrationView.referenceId);
        return {
          ...base!,
          // FSP-specific additions:
          phoneNumber: registrationView[FspAttributes.phoneNumber]!,
        };
      });
    await this.transactionQueuesService.addNedbankTransactionJobs(
      nedbankTransferJobs,
    );
  }

  /**
   * Creates and adds onafriq transaction jobs.
   *
   * This method is responsible for creating transaction jobs for Onafriq. It fetches necessary PA data and maps it to a FSP specific DTO.
   * It then adds these jobs to the transaction queue.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddOnafriqTransactionJobs({
    referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
    fspName,
  }: {
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
    fspName: Fsps;
  }): Promise<void> {
    const { registrationViews, sharedJobsByReferenceId } =
      await this.createSharedJobs({
        referenceIdsTransactionAmounts,
        programId,
        paymentId,
        userId,
        isRetry,
        fspName,
      });

    const onafriqTransactionJobs: OnafriqTransactionJobDto[] =
      registrationViews.map((registrationView): OnafriqTransactionJobDto => {
        const base = sharedJobsByReferenceId.get(registrationView.referenceId);
        return {
          ...base!,
          // FSP-specific additions:
          phoneNumberPayment:
            registrationView[FspAttributes.phoneNumberPayment],
          firstName: registrationView[FspAttributes.firstName],
          lastName: registrationView[FspAttributes.lastName],
        };
      });
    await this.transactionQueuesService.addOnafriqTransactionJobs(
      onafriqTransactionJobs,
    );
  }

  /**
   * Creates and adds Excel-FSP transaction jobs.
   *
   * This method is responsible for creating transaction jobs for Excel-FSP. It fetches necessary PA data and maps it to a FSP specific DTO.
   * It then adds these jobs to the transaction queue.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddExcelTransactionJobs({
    referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
    fspName,
  }: {
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
    fspName: Fsps;
  }): Promise<void> {
    const { registrationViews, sharedJobsByReferenceId } =
      await this.createSharedJobs({
        referenceIdsTransactionAmounts,
        programId,
        paymentId,
        userId,
        isRetry,
        fspName,
      });

    const excelTransactionJobs: ExcelTransactionJobDto[] =
      registrationViews.map((registrationView): ExcelTransactionJobDto => {
        const base = sharedJobsByReferenceId.get(registrationView.referenceId);
        return {
          ...base!,
          // FSP-specific additions: none for Excel
        };
      });
    await this.transactionQueuesService.addExcelTransactionJobs(
      excelTransactionJobs,
    );
  }

  /**
   * Creates and adds Commercial Bank of Ethiopia transaction jobs.
   *
   * This method is responsible for creating transaction jobs for Commercial Bank of Ethiopia.
   * It fetches necessary PA data and maps it to a FSP-specific DTO, then adds these jobs to the transaction queue.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   */
  private async createAndAddCommercialBankEthiopiaTransactionJobs({
    referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
    fspName,
  }: {
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
    fspName: Fsps;
  }): Promise<void> {
    const { registrationViews, sharedJobsByReferenceId } =
      await this.createSharedJobs({
        referenceIdsTransactionAmounts,
        programId,
        paymentId,
        userId,
        isRetry,
        fspName,
      });

    // Build the job DTOs
    const cbeTransferJobs: CommercialBankEthiopiaTransactionJobDto[] =
      registrationViews.map(
        (registrationView): CommercialBankEthiopiaTransactionJobDto => {
          const base = sharedJobsByReferenceId.get(
            registrationView.referenceId,
          );
          return {
            ...base!,
            // FSP-specific additions:
            bankAccountNumber:
              registrationView[FspAttributes.bankAccountNumber]!,
            fullName: registrationView[FspAttributes.fullName]!,
          };
        },
      );

    // debitTheirRef is the idempotency key used by CBE
    // When payment is not retry it is generated before the jobs are put into the queue
    // If a 'job retry' happens because the service crashes while processing the queue,
    // the same debitTheirRef will be used to attempt a transaction
    // When payment is retried the debitTheirRef is already stored in the (failed) transaction entity
    // During job processing, the previous debitTheirRef will be retrieved from the transaction entity and used to create call CBE api
    if (!isRetry) {
      cbeTransferJobs.forEach((job) => {
        job.debitTheirRef =
          `${formatDateYYMMDD(new Date())}${generateRandomNumerics(10)}`.substring(
            0,
            16,
          );
      });
    }

    await this.transactionQueuesService.addCommercialBankOfEthiopiaTransactionJobs(
      cbeTransferJobs,
    );
  }

  /**
   * Get registration views with FSP-specific attributes
   * @param referenceIdsTransactionAmounts - Array of reference IDs with transaction amounts
   * @param fspAttributeNames - Names of attributes to fetch
   * @param programId - Program ID
   * @returns Registration views with FSP-specific data
   */
  private async getRegistrationViews({
    referenceIdsTransactionAmounts,
    fspAttributeNames,
    programId,
  }: {
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    fspAttributeNames: string[];
    programId: number;
  }): Promise<MappedPaginatedRegistrationDto[]> {
    const referenceIds = referenceIdsTransactionAmounts.map(
      (r) => r.referenceId,
    );

    const defaultSelect: (keyof RegistrationViewEntity)[] = [
      'referenceId',
      'programFspConfigurationId',
      'fspName',
    ];

    const selectForPayment = [...defaultSelect, ...fspAttributeNames];

    const registrationViews =
      await this.registrationsPaginationService.getRegistrationViewsChunkedByReferenceIds(
        {
          programId,
          referenceIds,
          select: selectForPayment,
          chunkSize: 4000,
        },
      );
    return registrationViews;
  }

  private async createSharedJobs({
    referenceIdsTransactionAmounts,
    programId,
    paymentId,
    userId,
    isRetry,
    fspName,
  }: {
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    paymentId: number;
    userId: number;
    isRetry: boolean;
    fspName: Fsps;
  }): Promise<{
    registrationViews: MappedPaginatedRegistrationDto[];
    sharedJobsByReferenceId: Map<string, SharedTransactionJobDto>;
  }> {
    const fspAttributes = FSP_SETTINGS[fspName].attributes;
    const fspAttributeNames = fspAttributes.map((q) => q.name);
    const registrationViews = await this.getRegistrationViews({
      referenceIdsTransactionAmounts,
      fspAttributeNames,
      programId,
    });

    const transactionDataByReferenceId = new Map(
      referenceIdsTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );
    const sharedJobs: SharedTransactionJobDto[] = registrationViews.map(
      (registrationView): SharedTransactionJobDto => {
        return {
          programId,
          paymentId,
          userId,
          referenceId: registrationView.referenceId,
          programFspConfigurationId: registrationView.programFspConfigurationId,
          // Use hash-map to lookup transaction amount for this referenceId (with the 4000 chunk-size this takes less than 1ms)
          transactionAmount: transactionDataByReferenceId.get(
            registrationView.referenceId,
          )!,
          isRetry,
          bulkSize: referenceIdsTransactionAmounts.length,
        };
      },
    );
    const sharedJobsByReferenceId = new Map(
      sharedJobs.map((j) => [j.referenceId, j]),
    );

    return { registrationViews, sharedJobsByReferenceId };
  }
}
