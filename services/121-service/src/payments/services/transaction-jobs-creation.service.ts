import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';

import { FspAttributes } from '@121-service/src/fsps/enums/fsp-attributes.enum';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { getFspSettingByNameOrThrow } from '@121-service/src/fsps/fsp-settings.helpers';
import { ReferenceIdAndTransactionAmountInterface } from '@121-service/src/payments/interfaces/referenceid-transaction-amount.interface';
import { MappedPaginatedRegistrationDto } from '@121-service/src/registration/dto/mapped-paginated-registration.dto';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { AirtelTransactionJobDto } from '@121-service/src/transaction-queues/dto/airtel-transaction-job.dto';
import { CommercialBankEthiopiaTransactionJobDto } from '@121-service/src/transaction-queues/dto/commercial-bank-ethiopia-transaction-job.dto';
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { IntersolveVoucherTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-voucher-transaction-job.dto';
import { NedbankTransactionJobDto } from '@121-service/src/transaction-queues/dto/nedbank-transaction-job.dto';
import { OnafriqTransactionJobDto } from '@121-service/src/transaction-queues/dto/onafriq-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';
import { TransactionQueuesService } from '@121-service/src/transaction-queues/transaction-queues.service';
import { formatDateYYMMDD } from '@121-service/src/utils/formatDate';
import { generateRandomNumerics } from '@121-service/src/utils/random-value.helper';

// TODO: Refactor: This class has a lot of duplicate code it should be refactored to reduce redundancy.

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
    referenceIdsAndTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
  }: {
    fspName: string;
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    switch (fspName) {
      case Fsps.intersolveVisa:
        return await this.createAndAddIntersolveVisaTransactionJobs({
          referenceIdsAndTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
        });
      case Fsps.intersolveVoucherWhatsapp:
        return await this.createAndAddIntersolveVoucherTransactionJobs({
          referenceIdsAndTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
          useWhatsapp: true,
        });
      case Fsps.intersolveVoucherPaper:
        return await this.createAndAddIntersolveVoucherTransactionJobs({
          referenceIdsAndTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
          useWhatsapp: false,
        });
      case Fsps.safaricom:
        return await this.createAndAddSafaricomTransactionJobs({
          referenceIdsAndTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
        });
      case Fsps.airtel:
        return await this.createAndAddAirtelTransactionJobs({
          referenceIdsAndTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
        });
      case Fsps.nedbank:
        return await this.createAndAddNedbankTransactionJobs({
          referenceIdsAndTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
        });
      case Fsps.onafriq:
        return await this.createAndAddOnafriqTransactionJobs({
          referenceIdsAndTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
        });
      case Fsps.commercialBankEthiopia:
        return await this.createAndAddCommercialBankEthiopiaTransactionJobs({
          referenceIdsAndTransactionAmounts,
          programId,
          userId,
          paymentId,
          isRetry,
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
    referenceIdsAndTransactionAmounts: referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    //  TODO: REFACTOR: This 'ugly' code is now also in registrations.service.reissueCardAndSendMessage. This should be refactored when there's a better way of getting registration data.
    const intersolveVisaAttributes = getFspSettingByNameOrThrow(
      Fsps.intersolveVisa,
    ).attributes;
    const intersolveVisaAttributeNames = intersolveVisaAttributes.map(
      (q) => q.name,
    );
    const dataFieldNames = [
      FspAttributes.phoneNumber,
      ...intersolveVisaAttributeNames,
    ];
    const registrationViews = await this.getRegistrationViews(
      referenceIdsTransactionAmounts,
      dataFieldNames,
      programId,
    );

    // Convert the array into a map for increased performace (hashmap lookup)
    const transactionAmountsMap = new Map(
      referenceIdsTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );

    const intersolveVisaTransferJobs: IntersolveVisaTransactionJobDto[] =
      registrationViews.map(
        (registrationView): IntersolveVisaTransactionJobDto => {
          return {
            programId,
            userId,
            paymentId,
            referenceId: registrationView.referenceId,
            programFspConfigurationId:
              registrationView.programFspConfigurationId,
            // Use hashmap to lookup transaction amount for this referenceId (with the 4000 chuncksize this takes less than 1ms)
            transactionAmountInMajorUnit: transactionAmountsMap.get(
              registrationView.referenceId,
            )!,
            isRetry,
            bulkSize: referenceIdsTransactionAmounts.length,
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
      intersolveVisaTransferJobs,
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
    referenceIdsAndTransactionAmounts: referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
    useWhatsapp,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
    useWhatsapp: boolean;
  }): Promise<void> {
    const intersolveVoucherAttributes = getFspSettingByNameOrThrow(
      Fsps.intersolveVoucherWhatsapp,
    ).attributes;
    const intersolveVoucherAttributeNames = intersolveVoucherAttributes.map(
      (q) => q.name,
    );
    const dataFieldNames = [...intersolveVoucherAttributeNames];
    const registrationViews = await this.getRegistrationViews(
      referenceIdsTransactionAmounts,
      dataFieldNames,
      programId,
    );

    // Convert the array into a map for increased performace (hashmap lookup)
    const transactionAmountsMap = new Map(
      referenceIdsTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );

    const intersolveVoucherTransferJobs: IntersolveVoucherTransactionJobDto[] =
      registrationViews.map(
        (registrationView): IntersolveVoucherTransactionJobDto => {
          return {
            programId,
            userId,
            paymentId,
            referenceId: registrationView.referenceId,
            programFspConfigurationId:
              registrationView.programFspConfigurationId,
            transactionAmount: transactionAmountsMap.get(
              registrationView.referenceId,
            )!,
            isRetry,
            bulkSize: referenceIdsTransactionAmounts.length,
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
    referenceIdsAndTransactionAmounts: referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    const safaricomAttributes = getFspSettingByNameOrThrow(
      Fsps.safaricom,
    ).attributes;
    const safaricomAttributeNames = safaricomAttributes.map((q) => q.name);
    const registrationViews = await this.getRegistrationViews(
      referenceIdsTransactionAmounts,
      safaricomAttributeNames,
      programId,
    );

    // Convert the array into a map for increased performace (hashmap lookup)
    const transactionAmountsMap = new Map(
      referenceIdsTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );

    const safaricomTransferJobs: SafaricomTransactionJobDto[] =
      registrationViews.map((registrationView): SafaricomTransactionJobDto => {
        return {
          programId,
          paymentId,
          referenceId: registrationView.referenceId,
          programFspConfigurationId: registrationView.programFspConfigurationId,
          transactionAmount: transactionAmountsMap.get(
            registrationView.referenceId,
          )!,
          isRetry,
          userId,
          bulkSize: referenceIdsTransactionAmounts.length,
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
    referenceIdsAndTransactionAmounts: referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    // Some code to make linter happy.

    const airtelAttributes = getFspSettingByNameOrThrow(Fsps.airtel).attributes;
    const airtelAttributeNames = airtelAttributes.map((q) => q.name);
    const registrationViews = await this.getRegistrationViews(
      referenceIdsTransactionAmounts,
      airtelAttributeNames,
      programId,
    );

    // Convert the array into a map for increased performace (hashmap lookup)
    const transactionAmountsMap = new Map(
      referenceIdsTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );

    const airtelTransferJobs: AirtelTransactionJobDto[] = registrationViews.map(
      (registrationView): AirtelTransactionJobDto => {
        return {
          programId,
          paymentId,
          referenceId: registrationView.referenceId,
          programFspConfigurationId: registrationView.programFspConfigurationId,
          transactionAmount: transactionAmountsMap.get(
            registrationView.referenceId,
          )!,
          isRetry,
          userId,
          bulkSize: referenceIdsTransactionAmounts.length,
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
    referenceIdsAndTransactionAmounts: referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    const nedbankAttributes = getFspSettingByNameOrThrow(
      Fsps.nedbank,
    ).attributes;
    const nedbankAttributeNames = nedbankAttributes.map((q) => q.name);
    const registrationViews = await this.getRegistrationViews(
      referenceIdsTransactionAmounts,
      nedbankAttributeNames,
      programId,
    );

    // Convert the array into a map for increased performace (hashmap lookup)
    const transactionAmountsMap = new Map(
      referenceIdsTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );

    const nedbankTransferJobs: NedbankTransactionJobDto[] =
      registrationViews.map((registrationView): NedbankTransactionJobDto => {
        return {
          programId,
          paymentId,
          referenceId: registrationView.referenceId,
          programFspConfigurationId: registrationView.programFspConfigurationId,
          transactionAmount: transactionAmountsMap.get(
            registrationView.referenceId,
          )!,
          isRetry,
          userId,
          bulkSize: referenceIdsTransactionAmounts.length,
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
    referenceIdsAndTransactionAmounts: referenceIdsTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    const onafriqAttributes = getFspSettingByNameOrThrow(
      Fsps.onafriq,
    ).attributes;
    const onafriqAttributeNames = onafriqAttributes.map((q) => q.name);
    const registrationViews = await this.getRegistrationViews(
      referenceIdsTransactionAmounts,
      onafriqAttributeNames,
      programId,
    );

    // Convert the array into a map for increased performace (hashmap lookup)
    const transactionAmountsMap = new Map(
      referenceIdsTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );

    const onafriqTransactionJobs: OnafriqTransactionJobDto[] =
      registrationViews.map((registrationView): OnafriqTransactionJobDto => {
        return {
          programId,
          paymentId,
          referenceId: registrationView.referenceId,
          programFspConfigurationId: registrationView.programFspConfigurationId,
          transactionAmount: transactionAmountsMap.get(
            registrationView.referenceId,
          )!,
          isRetry,
          userId,
          bulkSize: referenceIdsTransactionAmounts.length,
          phoneNumber: registrationView.phoneNumber!,
          firstName: registrationView[FspAttributes.firstName],
          lastName: registrationView[FspAttributes.lastName],
        };
      });
    await this.transactionQueuesService.addOnafriqTransactionJobs(
      onafriqTransactionJobs,
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
    referenceIdsAndTransactionAmounts,
    programId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: {
      referenceId: string;
      transactionAmount: number;
    }[];
    programId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    // Attributes needed for CBE
    const cbeAttributes = getFspSettingByNameOrThrow(
      Fsps.commercialBankEthiopia,
    ).attributes;
    const cbeAttributeNames = cbeAttributes.map((q) => q.name);
    const registrationViews = await this.getRegistrationViews(
      referenceIdsAndTransactionAmounts,
      cbeAttributeNames,
      programId,
    );

    // Map for quick lookup of transaction amounts by referenceId
    const transactionAmountsMap = new Map(
      referenceIdsAndTransactionAmounts.map((item) => [
        item.referenceId,
        item.transactionAmount,
      ]),
    );

    // Build the job DTOs
    const cbeTransferJobs: CommercialBankEthiopiaTransactionJobDto[] =
      registrationViews.map((registrationView) => ({
        programId,
        paymentId,
        referenceId: registrationView.referenceId,
        programFspConfigurationId: registrationView.programFspConfigurationId,
        transactionAmount: transactionAmountsMap.get(
          registrationView.referenceId,
        )!,
        isRetry,
        userId,
        bulkSize: referenceIdsAndTransactionAmounts.length,
        bankAccountNumber: registrationView[FspAttributes.bankAccountNumber]!,
        fullName: registrationView[FspAttributes.fullName]!,
      }));

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
   * @param attributeNames - Names of attributes to fetch
   * @param programId - Program ID
   * @returns Registration views with FSP-specific data
   */
  private async getRegistrationViews(
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[],
    attributeNames: string[],
    programId: number,
  ): Promise<MappedPaginatedRegistrationDto[]> {
    const referenceIds = referenceIdsTransactionAmounts.map(
      (r) => r.referenceId,
    );
    const paginateQuery =
      this.registrationsBulkService.getRegistrationsForPaymentQuery(
        referenceIds,
        attributeNames,
      );

    const registrationViews =
      await this.registrationsPaginationService.getRegistrationsChunked(
        programId,
        paginateQuery,
        4000,
      );
    return registrationViews;
  }
}
