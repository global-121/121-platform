import { TestBed } from '@automock/jest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';

import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { ProgramService } from '@121-service/src/programs/programs.service';
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

    // Mock programService.findProgramOrThrow
    const programService = unitRef.get(ProgramService);
    jest
      .spyOn(programService as any, 'findProgramOrThrow')
      .mockImplementation(() => ({
        allowEmptyPhoneNumber: false,
      }));

    // Mock registrationsInputValidator.findProgramOrThrow
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

    // Mock programRepository.findOneBy
    const programRepository = unitRef.get(
      getRepositoryToken(ProgramEntity) as string,
    );
    jest.spyOn(programRepository as any, 'findOneBy').mockImplementation(() => {
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
