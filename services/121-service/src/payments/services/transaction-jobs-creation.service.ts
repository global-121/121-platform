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
import { IntersolveVisaTransactionJobDto } from '@121-service/src/transaction-queues/dto/intersolve-visa-transaction-job.dto';
import { NedbankTransactionJobDto } from '@121-service/src/transaction-queues/dto/nedbank-transaction-job.dto';
import { OnafriqTransactionJobDto } from '@121-service/src/transaction-queues/dto/onafriq-transaction-job.dto';
import { SafaricomTransactionJobDto } from '@121-service/src/transaction-queues/dto/safaricom-transaction-job.dto';
import { TransactionQueuesService } from '@121-service/src/transaction-queues/transaction-queues.service';

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
    projectId,
    userId,
    paymentId,
    isRetry,
  }: {
    fspName: string;
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    projectId: number;
    userId: number;
    paymentId: number;
    isRetry: boolean;
  }): Promise<void> {
    switch (fspName) {
      case Fsps.intersolveVisa:
        return await this.createAndAddIntersolveVisaTransactionJobs({
          referenceIdsAndTransactionAmounts,
          projectId,
          userId,
          paymentId,
          isRetry,
        });
      case Fsps.safaricom:
        return await this.createAndAddSafaricomTransactionJobs({
          referenceIdsAndTransactionAmounts,
          projectId,
          userId,
          paymentId,
          isRetry,
        });
      case Fsps.airtel:
        return await this.createAndAddAirtelTransactionJobs({
          referenceIdsAndTransactionAmounts,
          projectId,
          userId,
          paymentId,
          isRetry,
        });
      case Fsps.nedbank:
        return await this.createAndAddNedbankTransactionJobs({
          referenceIdsAndTransactionAmounts,
          projectId,
          userId,
          paymentId,
          isRetry,
        });
      case Fsps.onafriq:
        return await this.createAndAddOnafriqTransactionJobs({
          referenceIdsAndTransactionAmounts,
          projectId,
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
   * @param {number} projectId - The ID of the project.
   * @param {number} paymentAmount - The amount to be transferred.
   * @param {number} paymentId - The payment number.
   * @param {boolean} isRetry - Whether this is a retry.
   *
   * @returns {Promise<void>} A promise that resolves when the transaction jobs have been created and added.
   *
   */
  private async createAndAddIntersolveVisaTransactionJobs({
    referenceIdsAndTransactionAmounts: referenceIdsTransactionAmounts,
    projectId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    projectId: number;
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
      projectId,
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
            projectId,
            userId,
            paymentId,
            referenceId: registrationView.referenceId,
            projectFspConfigurationId:
              registrationView.projectFspConfigurationId,
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
    projectId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    projectId: number;
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
      projectId,
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
          projectId,
          paymentId,
          referenceId: registrationView.referenceId,
          projectFspConfigurationId: registrationView.projectFspConfigurationId,
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
    projectId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    projectId: number;
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
      projectId,
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
          projectId,
          paymentId,
          referenceId: registrationView.referenceId,
          projectFspConfigurationId: registrationView.projectFspConfigurationId,
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
    projectId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    projectId: number;
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
      projectId,
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
          projectId,
          paymentId,
          referenceId: registrationView.referenceId,
          projectFspConfigurationId: registrationView.projectFspConfigurationId,
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
    projectId,
    userId,
    paymentId,
    isRetry,
  }: {
    referenceIdsAndTransactionAmounts: ReferenceIdAndTransactionAmountInterface[];
    projectId: number;
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
      projectId,
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
          projectId,
          paymentId,
          referenceId: registrationView.referenceId,
          projectFspConfigurationId: registrationView.projectFspConfigurationId,
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
   * Get registration views with FSP-specific attributes
   * @param referenceIdsTransactionAmounts - Array of reference IDs with transaction amounts
   * @param attributeNames - Names of attributes to fetch
   * @param projectId - Project ID
   * @returns Registration views with FSP-specific data
   */
  private async getRegistrationViews(
    referenceIdsTransactionAmounts: ReferenceIdAndTransactionAmountInterface[],
    attributeNames: string[],
    projectId: number,
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
        projectId,
        paginateQuery,
        4000,
      );
    return registrationViews;
  }
}
