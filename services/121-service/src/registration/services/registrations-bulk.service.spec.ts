import { TestBed } from '@automock/jest';
import { getRepositoryToken } from '@nestjs/typeorm';

import { MessageQueuesService } from '@121-service/src/notifications/message-queues/message-queues.service';
import { MessageTemplateEntity } from '@121-service/src/notifications/message-template/message-template.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/entities/transaction.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationViewScopedRepository } from '@121-service/src/registration/repositories/registration-view-scoped.repository';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';
import { generateMockCreateQueryBuilder } from '@121-service/src/utils/test-helpers/createQueryBuilderMock.helper';

describe('RegistrationBulkService', () => {
  const paginateQuery = {
    path: 'test',
  };
  const programId = 2;
  const userId = 1;

  let registrationsBulkService: RegistrationsBulkService;
  let queueMessageService: MessageQueuesService;
  let registrationsPaginationService: RegistrationsPaginationService;

  const registrationMock = {
    namePartnerOrganization: 'testname',
  };

  const defaultPaginateResult = {
    data: [registrationMock],
    meta: {
      totalItems: 1,
      totalPages: 1,
    },
  };

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      RegistrationsBulkService,
    ).compile();

    registrationsBulkService = unit;

    // Get the mock repository from the testing module
    const messageTemplateRepository = unitRef.get(
      getRepositoryToken(MessageTemplateEntity) as string,
    );

    // Mock the findOne method
    jest
      .spyOn(messageTemplateRepository as any, 'findOne')
      .mockImplementation((arg: any) => {
        const programIdValue = arg.where.programId._value;
        const typeValue = arg.where.type._value;

        if (
          programIdValue === programId &&
          typeValue === RegistrationStatusEnum.new
        ) {
          return Promise.resolve({
            id: 1,
            name: 'test',
            language: RegistrationPreferredLanguage.en,
            type: RegistrationStatusEnum.new,
            message: 'test message',
            programId: 2,
          });
        }
        return Promise.resolve(null);
      });

    const dbQueryResult = null;
    const createQueryBuilder: any = generateMockCreateQueryBuilder(
      dbQueryResult,
      {
        useGetMany: true,
      },
    );

    const registrationViewScopedRepository = unitRef.get(
      RegistrationViewScopedRepository,
    );

    jest
      .spyOn(registrationViewScopedRepository as any, 'createQueryBuilder')
      .mockImplementation(() => createQueryBuilder) as any;

    const registrationsPaginationServiceRef = unitRef.get(
      RegistrationsPaginationService,
    );
    registrationsPaginationService = registrationsPaginationServiceRef;

    jest
      .spyOn(registrationsPaginationServiceRef as any, 'getPaginate')
      .mockImplementation(() => defaultPaginateResult);

    queueMessageService = unitRef.get(MessageQueuesService);

    jest
      .spyOn(
        registrationsPaginationServiceRef as any,
        'getRegistrationViewsNoLimit',
      )
      .mockImplementation(() => {
        return [registrationMock];
      });

    jest
      .spyOn(queueMessageService as any, 'getPlaceholdersInMessageText')
      .mockImplementation(() => {
        return ['namePartnerOrganization'];
      });

    jest
      .spyOn(queueMessageService as any, 'addMessageToQueue')
      .mockImplementation();

    transactionScopedRepository = unitRef.get(
      getScopedRepositoryProviderName(TransactionEntity),
    );
  });

  it('should be defined', () => {
    expect(registrationsBulkService).toBeDefined();
  });

  describe('post messages', () => {
    it('should throw an error if template is not defined', async () => {
      // Arrange

      // Act
      // Assert
      await expect(
        registrationsBulkService.sendMessagesOrDryRun(
          paginateQuery,
          programId,
          'randomMessage',
          'randomNotDefinedStatus',
          false,
          userId,
        ),
      ).rejects.toHaveProperty('status', 404);
    });

    it('postMessage with dryrun should return result and not send messages', async () => {
      // Arrange

      // Act
      const postMessageResult =
        await registrationsBulkService.sendMessagesOrDryRun(
          paginateQuery,
          programId,
          'randomMessage',
          RegistrationStatusEnum.new,
          true,
          userId,
        );
      // Assert
      expect(postMessageResult).toBeDefined();
      expect(postMessageResult).toStrictEqual({
        totalFilterCount: 1,
        applicableCount: 1,
        nonApplicableCount: 0,
      });
      expect(queueMessageService.addMessageJob).toHaveBeenCalledTimes(0);
    });

    it('should return result and add messages to queue', async () => {
      // Act
      const postMessageResult =
        await registrationsBulkService.sendMessagesOrDryRun(
          paginateQuery,
          programId,
          'randomMessage',
          RegistrationStatusEnum.new,
          false,
          userId,
        );

      // Assert
      expect(postMessageResult).toBeDefined();
      expect(postMessageResult).toStrictEqual({
        totalFilterCount: 1,
        applicableCount: 1,
        nonApplicableCount: 0,
      });

      // Wait for all pending asynchronous operations to complete
      await new Promise((resolve) => setImmediate(resolve));

      // Assert
      expect(queueMessageService.addMessageJob).toHaveBeenCalled();
    });
  });

  describe('pending approval count on status change', () => {
    const messageContentDetails = {
      message: undefined,
      messageTemplateKey: undefined,
      messageContentType: undefined,
    };

    it.each([
      {
        registrationStatus: RegistrationStatusEnum.declined,
        pendingApprovalCount: 0,
      },
      {
        registrationStatus: RegistrationStatusEnum.paused,
        pendingApprovalCount: 2,
      },
    ])(
      'returns $pendingApprovalCount pending approvals when changing status to $registrationStatus',
      async ({ registrationStatus, pendingApprovalCount }) => {
        jest
          .spyOn(registrationsPaginationService as any, 'getPaginate')
          .mockImplementationOnce(() => defaultPaginateResult)
          .mockImplementationOnce(() => defaultPaginateResult)
          .mockImplementationOnce(() => ({
            data: Array.from(
              { length: pendingApprovalCount },
              () => registrationMock,
            ),
            meta: {
              totalItems: pendingApprovalCount,
              totalPages: 1,
            },
          }));

        const result =
          await registrationsBulkService.updateRegistrationStatusOrDryRun({
            paginateQuery,
            programId,
            registrationStatus,
            dryRun: true,
            userId,
            messageContentDetails,
          });

        expect(result.pendingApprovalCount).toBe(pendingApprovalCount);
      },
    );

    it.each([RegistrationStatusEnum.declined, RegistrationStatusEnum.paused])(
      'does not compute pendingApprovalCount when changing status to %s without a dry run',
      async (registrationStatus) => {
        const result =
          await registrationsBulkService.updateRegistrationStatusOrDryRun({
            paginateQuery,
            programId,
            registrationStatus,
            dryRun: false,
            userId,
            messageContentDetails,
          });

        expect(result.pendingApprovalCount).toBeUndefined();
        expect(
          registrationsPaginationService.getPaginate,
        ).toHaveBeenCalledTimes(2);
      },
    );

    it('does not compute pendingApprovalCount during dry run for statuses not requiring the check', async () => {
      const result =
        await registrationsBulkService.updateRegistrationStatusOrDryRun({
          paginateQuery,
          programId,
          registrationStatus: RegistrationStatusEnum.included,
          dryRun: true,
          userId,
          messageContentDetails,
        });

      expect(result.pendingApprovalCount).toBeUndefined();
    });
  });
});
