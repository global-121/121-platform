import { Test } from '@nestjs/testing';
import { MockFunctionMetadata, ModuleMocker } from 'jest-mock';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsBulkService } from './services/registrations-bulk.service';
import { BulkActionResultDto } from './dto/bulk-action-result.dto';
import { SendCustomTextDto } from './dto/send-custom-text.dto';

const moduleMocker = new ModuleMocker(global);

describe('RegistrationsBulkService', () => {
  let controller: RegistrationsController;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RegistrationsController],
    })
      .useMocker((token) => {
        const results = {
          totalFilterCount: 1,
          applicableCount: 1,
          nonApplicableCount: 0,
        };
        if (token === RegistrationsBulkService) {
          return { findAll: jest.fn().mockResolvedValue(results) };
        }
        if (typeof token === 'function') {
          const mockMetadata = moduleMocker.getMetadata(
            token,
          ) as MockFunctionMetadata<any, any>;
          const Mock = moduleMocker.generateFromMetadata(mockMetadata);
          return new Mock();
        }
      })
      .compile();

    controller = moduleRef.get(RegistrationsController);
  });

  describe('postMessages', () => {
    it('should get the applicable count with dryRun=true', async () => {
      // Mock the postMessages method to return the bulk acion result
      const mockBulkActionResponse: BulkActionResultDto = {
        totalFilterCount: 1,
        applicableCount: 1,
        nonApplicableCount: 0,
      };
      const postMessagesMock = jest
        .spyOn(controller, 'sendCustomTextMessage')
        .mockResolvedValue(mockBulkActionResponse);

      const messagePayload: SendCustomTextDto = {
        message: 'dsadsaasd12123dsadsadsaasd12123dsa',
        skipMessageValidation: true,
      };
      const paginateQuery = {
        page: undefined,
        limit: undefined,
        sortBy: undefined,
        search: undefined,
        searchBy: undefined,
        filter: { status: '$in:included' },
        select: undefined,
        path: 'http://localhost:3000/api/programs/3/registrations/message',
      };
      const userId = 1;
      const programId = 3;
      const queryParams = {
        dryRun: true,
      };

      const response = await controller.sendCustomTextMessage(
        messagePayload,
        paginateQuery,
        userId,
        programId,
        queryParams,
      );

      // Ensure that the response matches the expected result
      expect(response).toEqual(mockBulkActionResponse);

      // Ensure that the createNote method was called with the correct arguments
      expect(postMessagesMock).toHaveBeenCalledWith(
        messagePayload,
        paginateQuery,
        userId,
        programId,
        queryParams,
      );
    });
  });
});
