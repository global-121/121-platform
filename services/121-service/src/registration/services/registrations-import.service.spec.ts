import { TestBed } from '@automock/jest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FinancialServiceProviderName } from '../../financial-service-providers/enum/financial-service-provider-name.enum';
import { ProgramEntity } from '../../programs/program.entity';
import { UserService } from '../../user/user.service';
import { GenericAttributes } from '../enum/custom-data-attributes';
import { LanguageEnum } from '../enum/language.enum';
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
      fspName: FinancialServiceProviderName.intersolveVoucherPaper,
      whatsappPhoneNumber: '',
    },
  ];

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      RegistrationsImportService,
    ).compile();
    registrationsImportService = unit;

    // Mock userService.getUserScopeForProgram
    const userService = unitRef.get(UserService);
    jest
      .spyOn(userService as any, 'getUserScopeForProgram')
      .mockImplementation(() => null);

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

      // Act

      // Assert
      await expect(
        registrationsImportService.validateRegistrationsInput(
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
