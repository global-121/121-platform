import { TestBed } from '@automock/jest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MessageTemplateEntity } from '../../notifications/message-template/message-template.entity';
import { QueueMessageService } from '../../notifications/queue-message/queue-message.service';
import { generateMockCreateQueryBuilder } from '../../utils/createQueryBuilderMock.helper';
import { LanguageEnum } from '../enum/language.enum';
import { RegistrationStatusEnum } from '../enum/registration-status.enum';
import { RegistrationViewScopedRepository } from '../registration-scoped.repository';
import { RegistrationsBulkService } from './registrations-bulk.service';
import { RegistrationsPaginationService } from './registrations-pagination.service';

describe('RegistrationBulkService', () => {
  const paginateQuery = {
    path: 'test',
  };
  const programId = 2;

  let registrationsBulkService: RegistrationsBulkService;
  let queueMessageService: QueueMessageService;

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
        if (arg.where.type === RegistrationStatusEnum.registered) {
          return Promise.resolve({
            id: 1,
            name: 'test',
            language: LanguageEnum.en,
            type: 'test',
            message: 'test',
            programId: 2,
          });
        } else {
          return null;
        }
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

    const registrationsPaginationService = unitRef.get(
      RegistrationsPaginationService,
    );

    jest
      .spyOn(registrationsPaginationService as any, 'getPaginate')
      .mockImplementation(() => {
        return {
          data: [
            {
              namePartnerOrganization: 'testname',
            },
          ],
          meta: {
            totalItems: 1,
            totalPages: 1,
          },
        };
      });
    queueMessageService = unitRef.get(QueueMessageService);

    jest
      .spyOn(queueMessageService as any, 'getPlaceholdersInMessageText')
      .mockImplementation(() => {
        return ['namePartnerOrganization'];
      });

    jest
      .spyOn(queueMessageService as any, 'addMessageToQueue')
      .mockImplementation();
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
        registrationsBulkService.postMessages(
          paginateQuery,
          programId,
          null,
          RegistrationStatusEnum.invited,
          false,
        ),
      ).rejects.toHaveProperty('status', 404);
    });

    it('postMessage with dryrun should return result and not send messages', async () => {
      // Arrange

      // Act
      const postMessageResult = await registrationsBulkService.postMessages(
        paginateQuery,
        programId,
        null,
        RegistrationStatusEnum.registered,
        true,
      );
      // Assert
      expect(postMessageResult).toBeDefined();
      expect(postMessageResult).toStrictEqual({
        totalFilterCount: 1,
        applicableCount: 1,
        nonApplicableCount: 0,
      });
      expect(queueMessageService.addMessageToQueue).toHaveBeenCalledTimes(0);
    });

    it('should return result and add messages to queue', async () => {
      // Act
      const postMessageResult = await registrationsBulkService.postMessages(
        paginateQuery,
        programId,
        null,
        RegistrationStatusEnum.registered,
        false,
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
      expect(queueMessageService.addMessageToQueue).toHaveBeenCalled();
    });
  });
});
