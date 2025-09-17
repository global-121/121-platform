import { TestBed } from '@automock/jest';

import { TransactionCreationDetails } from '@121-service/src/payments/interfaces/transaction-creation-details.interface';
import { PaymentsExecutionService } from '@121-service/src/payments/services/payments-execution.service';
import { TransactionsService } from '@121-service/src/payments/transactions/transactions.service';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { RegistrationStatusEnum } from '@121-service/src/registration/enum/registration-status.enum';
import { RegistrationScopedRepository } from '@121-service/src/registration/repositories/registration-scoped.repository';
import { RegistrationEventsService } from '@121-service/src/registration-events/registration-events.service';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

const mockedRegistration: RegistrationEntity = {
  id: 1,
  referenceId: 'ref-123',
  registrationStatus: RegistrationStatusEnum.included,
  paymentCount: 0,
  preferredLanguage: LanguageEnum.en,
} as RegistrationEntity;

const mockedTransactionCreationDetails: TransactionCreationDetails[] = [
  {
    registrationId: 1,
    transactionAmount: 100,
    programFspConfigurationId: 1,
  },
];
const mockProgramId = 1;
const mockPaymentId = 1;
const mockUserId = 1;
const mockTransactionId = 1;

const mockedProgram = {
  enableMaxPayments: true,
};

describe('PaymentsExecutionService', () => {
  let service: PaymentsExecutionService;
  let transactionsService: TransactionsService;
  let registrationScopedRepository: RegistrationScopedRepository;
  let programRepository: ProgramRepository;
  let registrationEventsService: RegistrationEventsService;

  beforeEach(async () => {
    const { unit, unitRef } = TestBed.create(
      PaymentsExecutionService,
    ).compile();

    service = unit;
    registrationScopedRepository = unitRef.get<RegistrationScopedRepository>(
      RegistrationScopedRepository,
    );
    transactionsService = unitRef.get<TransactionsService>(TransactionsService);
    programRepository = unitRef.get<ProgramRepository>(ProgramRepository);
    registrationEventsService = unitRef.get<RegistrationEventsService>(
      RegistrationEventsService,
    );

    jest
      .spyOn(transactionsService, 'createTransactionsAndEvents')
      .mockResolvedValue([mockTransactionId]);
    jest
      .spyOn(registrationScopedRepository, 'updatePaymentCounts')
      .mockImplementation();
    jest
      .spyOn(programRepository, 'findByIdOrFail')
      .mockResolvedValue(mockedProgram as any);
    jest
      .spyOn(registrationScopedRepository, 'getRegistrationsToComplete')
      .mockResolvedValue([mockedRegistration]);
    jest
      .spyOn(registrationEventsService, 'createFromRegistrationViews')
      .mockResolvedValue();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createTransactionsAndUpdateRegistrations', () => {
    it('should update the payment count', async () => {
      // Arrange
      const registrationIds = mockedTransactionCreationDetails.map(
        (detail) => detail.registrationId,
      );

      // Act
      await service.createTransactionsAndUpdateRegistrations({
        transactionCreationDetails: mockedTransactionCreationDetails,
        programId: mockProgramId,
        paymentId: mockPaymentId,
        userId: mockUserId,
      });

      // Assert
      expect(
        registrationScopedRepository.updatePaymentCounts,
      ).toHaveBeenCalledTimes(1);
      expect(
        registrationScopedRepository.updatePaymentCounts,
      ).toHaveBeenCalledWith(
        registrationIds,
        expect.any(Number) /* chunkSize */,
      );
    });

    // ##TODO update this test and others here with conflicting changes from https://github.com/global-121/121-platform/pull/7302/files
    // it('should not update the registration status to complete if the program does not have maxPayments', async () => {
    //   // Arrange
    //   const mockedProgramNoMaxPayments = {
    //     enableMaxPayments: false,
    //   };
    //   jest
    //     .spyOn(programRepository, 'findByIdOrFail')
    //     .mockResolvedValue(mockedProgramNoMaxPayments as any);

    //   // Act
    //   await service.createTransactionsAndUpdateRegistrations({
    //     transactionCreationDetails: mockedTransactionCreationDetails,
    //     programId: mockProgramId,
    //     paymentId: mockPaymentId,
    //     userId: mockUserId,
    //   });

    //   // Assert
    //   expect(
    //     registrationScopedRepository.updateRegistrationsToCompleted,
    //   ).not.toHaveBeenCalled();
    // });

    it('create a registration status change event if status moved to "completed"', async () => {
      // Arrange

      // Act
      await service.createTransactionsAndUpdateRegistrations({
        transactionCreationDetails: mockedTransactionCreationDetails,
        programId: mockProgramId,
        paymentId: mockPaymentId,
        userId: mockUserId,
      });

      // Assert
      expect(
        registrationEventsService.createFromRegistrationViews,
      ).toHaveBeenCalledWith(
        { id: 1, status: 'included' },
        { id: 1, status: 'completed' },
        { explicitRegistrationPropertyNames: ['status'] },
      );
    });

    it('does not create a registration status change event if status did not move', async () => {
      // Arrange
      const registrationsToComplete = [];
      jest
        .spyOn(registrationScopedRepository, 'getRegistrationsToComplete')
        .mockResolvedValue(registrationsToComplete);

      // Act
      await service.createTransactionsAndUpdateRegistrations({
        transactionCreationDetails: mockedTransactionCreationDetails,
        programId: mockProgramId,
        paymentId: mockPaymentId,
        userId: mockUserId,
      });

      // Assert
      expect(
        registrationEventsService.createFromRegistrationViews,
      ).not.toHaveBeenCalled();
    });
  });
});
