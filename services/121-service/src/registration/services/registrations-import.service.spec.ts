import { TestBed } from '@automock/jest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FspName } from '../../fsp/enum/fsp-name.enum';
import { ProgramEntity } from '../../programs/program.entity';
import { ProgramService } from '../../programs/programs.service';
import { GenericAttributes } from '../enum/custom-data-attributes';
import { LanguageEnum } from '../enum/language.enum';
import { RegistrationsInputValidator } from '../validators/registrations-input-validator';
import { RegistrationsImportService } from './registrations-import.service';

describe('RegistrationsImportService', () => {
  let registrationsImportService: RegistrationsImportService;

  const programId = 2;
  const language = LanguageEnum.en;
  const importRegistrationsCsvInput = [
    {
      namePartnerOrganization: 'ABC',
      preferredLanguage: language,
      paymentAmountMultiplier: '',
      maxPayments: '5',
      nameFirst: 'Test',
      nameLast: 'Test',
      phoneNumber: '31600000000',
      fspName: FspName.intersolveVoucherPaper,
      whatsappPhoneNumber: '',
    },
  ];

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
              column: GenericAttributes.phoneNumber,
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

  describe('validate registrations to import', () => {
    it('should throw an error if phoneNumber is empty while not allowed', async () => {
      // Arrange
      importRegistrationsCsvInput[0].phoneNumber = '';
      const userId = 1;

      // Assert
      await expect(
        registrationsImportService.validateImportAsRegisteredInput(
          importRegistrationsCsvInput,
          programId,
          userId,
        ),
      ).rejects.toHaveProperty('response', [
        {
          lineNumber: 1,
          column: GenericAttributes.phoneNumber,
          value: '',
          error: 'PhoneNumber is not allowed to be empty',
        },
      ]);
    });
  });
});
