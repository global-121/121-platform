import { TestBed } from '@automock/jest';
import { HttpStatus } from '@nestjs/common';
import { PaginateQuery } from 'nestjs-paginate';

import { RegistrationStatusPatchDto } from '@121-service/src/registration/dto/registration-status-patch.dto';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationsController } from '@121-service/src/registration/registrations.controller';
import { RegistrationsBulkService } from '@121-service/src/registration/services/registrations-bulk.service';
import { RegistrationsPaginationService } from '@121-service/src/registration/services/registrations-pagination.service';
import { ScopedUserRequest } from '@121-service/src/shared/scoped-user-request';

describe('RegistrationsController', () => {
  let registrationController: RegistrationsController;
  let registrationsPaginationService: jest.Mocked<RegistrationsPaginationService>;
  let registrationsBulkService: jest.Mocked<RegistrationsBulkService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(RegistrationsController).compile();

    registrationController = unit;
    registrationsPaginationService = unitRef.get(
      RegistrationsPaginationService,
    );
    registrationsBulkService = unitRef.get(RegistrationsBulkService);

    jest
      .spyOn(registrationsPaginationService, 'userHasPermissionForProject')
      .mockResolvedValue(false)
      .mockResolvedValueOnce(true) // update-status permission check
      .mockResolvedValueOnce(false); // send-message permission check

    jest
      .spyOn(registrationsPaginationService, 'throwIfNoPersonalReadPermission')
      .mockResolvedValue(); // do not throw
  });

  describe('Change registation status with right status-change permission', () => {
    const paginateQuery: PaginateQuery = {
      path: '',
    };
    const mockRequest: ScopedUserRequest = {
      user: {
        id: 1,
      },
    } as unknown as ScopedUserRequest;
    const projectId = 1;
    const dryRun = 'true';

    it('should throw exception when user includes a message, but does not have permission for that', async () => {
      const statusUpdateDto: RegistrationStatusPatchDto = {
        status: RegistrationStatusEnum.validated,
        message: 'message that should not be there',
        messageTemplateKey: undefined,
      };

      await expect(
        registrationController.patchRegistrationsStatus(
          paginateQuery,
          statusUpdateDto,
          mockRequest,
          projectId,
          dryRun,
        ),
      ).rejects.toHaveProperty('status', 403); // Forbidden
    });

    it('should throw exception when user includes a messageTemplateKey, but does not have permission for that', async () => {
      const statusUpdateDto: RegistrationStatusPatchDto = {
        status: RegistrationStatusEnum.validated,
        message: undefined,
        messageTemplateKey: RegistrationStatusEnum.validated,
      };

      await expect(
        registrationController.patchRegistrationsStatus(
          paginateQuery,
          statusUpdateDto,
          mockRequest,
          projectId,
          dryRun,
        ),
      ).rejects.toHaveProperty('status', 403); // Forbidden
    });

    it('should not throw exception when user does not include a message', async () => {
      const statusUpdateDto: RegistrationStatusPatchDto = {
        status: RegistrationStatusEnum.validated,
        message: undefined,
        messageTemplateKey: undefined,
      };

      const patchRegistrationsStatusResult = {
        totalFilterCount: 1,
        applicableCount: 1,
        nonApplicableCount: 0,
      };

      jest
        .spyOn(registrationsBulkService, 'patchRegistrationsStatus')
        .mockResolvedValue(patchRegistrationsStatusResult);

      await expect(
        registrationController.patchRegistrationsStatus(
          paginateQuery,
          statusUpdateDto,
          mockRequest,
          projectId,
          dryRun,
        ),
      ).rejects.toMatchObject({
        status: HttpStatus.OK,
        response: patchRegistrationsStatusResult,
      });
    });
  });
});
