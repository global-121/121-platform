import { TestBed } from '@automock/jest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { ProjectService } from '@121-service/src/projects/projects.service';
import { GenericRegistrationAttributes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationsImportService } from '@121-service/src/registration/services/registrations-import.service';
import { RegistrationsInputValidator } from '@121-service/src/registration/validators/registrations-input-validator';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

describe('RegistrationsImportService', () => {
  let registrationsImportService: RegistrationsImportService;

  const language = LanguageEnum.en;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      RegistrationsImportService,
    ).compile();
    registrationsImportService = unit;

    // Mock projectService.findProjectOrThrow
    const projectService = unitRef.get(ProjectService);
    jest
      .spyOn(projectService as any, 'findProjectOrThrow')
      .mockImplementation(() => ({
        allowEmptyPhoneNumber: false,
      }));

    // Mock registrationsInputValidator.findProjectOrThrow
    const registrationsInputValidator = unitRef.get(
      RegistrationsInputValidator,
    );
    jest
      .spyOn(
        registrationsInputValidator as any,
        'validateAndCleanRegistrationsInput',
      )
      .mockImplementation(() => {
        throw new HttpException(
          [
            {
              lineNumber: 1,
              column: GenericRegistrationAttributes.phoneNumber,
              value: '',
              error: 'PhoneNumber is not allowed to be empty',
            },
          ],
          HttpStatus.BAD_REQUEST,
        );
      });

    // Mock getDynamicAttributes
    jest
      .spyOn(registrationsImportService as any, 'getDynamicAttributes')
      .mockImplementation(() => []);

    // Mock projectRepository.findOneBy
    const projectRepository = unitRef.get(
      getRepositoryToken(ProjectEntity) as string,
    );
    jest.spyOn(projectRepository as any, 'findOneBy').mockImplementation(() => {
      return Promise.resolve({
        allowEmptyPhoneNumber: false,
        languages: [language],
      });
    });
  });

  it('should be defined', () => {
    expect(registrationsImportService).toBeDefined();
  });
});
