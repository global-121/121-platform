import { TestBed } from '@automock/jest';
import { PaginateQuery } from 'nestjs-paginate';
import { UserService } from '../user/user.service';
import { RegistrationStatusPatchDto } from './dto/registration-status-patch.dto';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';
import { RegistrationsBulkService } from './services/registrations-bulk.service';
import { RegistrationsPaginationService } from './services/registrations-pagination.service';

describe('RegistrationController', () => {
  let registrationController: RegistrationsController;
  let registrationsService: jest.Mocked<RegistrationsService>;
  let registrationsPaginationService: jest.Mocked<RegistrationsPaginationService>;
  let registrationsBulkService: jest.Mocked<RegistrationsBulkService>;
  let userService: jest.Mocked<UserService>;

  beforeEach(() => {
    const { unit, unitRef } = TestBed.create(RegistrationsController).compile();

    registrationController = unit;
    registrationsService = unitRef.get(RegistrationsService);
    registrationsPaginationService = unitRef.get(
      RegistrationsPaginationService,
    );
    registrationsBulkService = unitRef.get(RegistrationsBulkService);
    userService = unitRef.get(UserService);

    jest
      .spyOn(registrationsPaginationService, 'userHasPermissionForProgram')
      .mockResolvedValue(true);
  });

  it('should throw exception when user does not have permission to send a message', async () => {
    const paginateQuery: PaginateQuery = {
      path: '1',
    };
    const statusUpdateDto: RegistrationStatusPatchDto = {
      status: RegistrationStatusEnum.validated,
      message: null,
      messageTemplateKey: null,
    };
    const userId = 1;
    const programId = 1;
    const queryParams = {
      dryRun: false,
    };
    const patchResult = await registrationController.patchRegistrationsStatus(
      paginateQuery,
      statusUpdateDto,
      userId,
      programId,
      queryParams,
    );

    expect(patchResult).toThrow();
  });
});
