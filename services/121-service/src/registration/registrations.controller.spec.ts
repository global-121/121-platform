import { TestBed } from '@automock/jest';
import { PaginateQuery } from 'nestjs-paginate';
import { RegistrationStatusPatchDto } from './dto/registration-status-patch.dto';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsBulkService } from './services/registrations-bulk.service';
import { RegistrationsPaginationService } from './services/registrations-pagination.service';

describe('RegistrationsController', () => {
  let registrationController: RegistrationsController;
  let registrationsPaginationService: jest.Mocked<RegistrationsPaginationService>;
  let registrationsBulkService: jest.Mocked<RegistrationsBulkService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(RegistrationsController).compile();
    const patchRegistrationsStatusResult = {
      totalFilterCount: 1,
      applicableCount: 1,
      nonApplicableCount: 0,
    };

    registrationController = unit;
    registrationsPaginationService = unitRef.get(
      RegistrationsPaginationService,
    );
    registrationsBulkService = unitRef.get(RegistrationsBulkService);

    jest
      .spyOn(registrationsPaginationService, 'userHasPermissionForProgram')
      .mockResolvedValue(false)
      .mockResolvedValueOnce(true) // update-status permission check
      .mockResolvedValueOnce(false); // send-message permission check

    jest
      .spyOn(registrationsPaginationService, 'throwIfNoPermissionsForQuery')
      .mockResolvedValue(null); // do not throw

    jest
      .spyOn(registrationsBulkService, 'patchRegistrationsStatus')
      .mockResolvedValue(patchRegistrationsStatusResult);
  });

  describe('Change registation status with right status-change permission', () => {
    const paginateQuery: PaginateQuery = {
      path: '',
    };
    const userId = 1;
    const programId = 1;
    const queryParams = {
      dryRun: true,
    };

    it('should throw exception when user includes a message, but does not have permission for that', async () => {
      const statusUpdateDto: RegistrationStatusPatchDto = {
        status: RegistrationStatusEnum.validated,
        message: 'message that should not be there',
        messageTemplateKey: null,
      };

      await expect(
        registrationController.patchRegistrationsStatus(
          paginateQuery,
          statusUpdateDto,
          userId,
          programId,
          queryParams,
        ),
      ).rejects.toHaveProperty('status', 403); // Forbidden
    });

    it('should throw exception when user includes a messageTemplatKey, but does not have permission for that', async () => {
      const statusUpdateDto: RegistrationStatusPatchDto = {
        status: RegistrationStatusEnum.validated,
        message: null,
        messageTemplateKey: RegistrationStatusEnum.validated,
      };

      await expect(
        registrationController.patchRegistrationsStatus(
          paginateQuery,
          statusUpdateDto,
          userId,
          programId,
          queryParams,
        ),
      ).rejects.toHaveProperty('status', 403); // Forbidden
    });

    it('should not throw exception when user does not include a message', async () => {
      const statusUpdateDto: RegistrationStatusPatchDto = {
        status: RegistrationStatusEnum.validated,
        message: null,
        messageTemplateKey: null,
      };

      const patchRegistrationsStatusResult =
        await registrationController.patchRegistrationsStatus(
          paginateQuery,
          statusUpdateDto,
          userId,
          programId,
          queryParams,
        );

      expect(patchRegistrationsStatusResult).toBe(
        patchRegistrationsStatusResult,
      );
    });
  });
});
