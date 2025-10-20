import { Test, TestingModule } from '@nestjs/testing';

import { IntersolveVisaChildWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-child-wallet.entity';
import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-customer.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { IntersolveVisaApiError } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa-api.error';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaCustomerScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-customer.scoped.repository';
import { IntersolveVisaParentWalletScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-parent-wallet.scoped.repository';
import { IntersolveVisaApiService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa.api.service';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/services/intersolve-visa.service';

const mockedToken = {
  blocked: false,
  status: IntersolveVisaTokenStatus.Active,
  balance: 100, // 1 euro in cents
};

const registrationId = 1;
const parentWallet = new IntersolveVisaParentWalletEntity();
parentWallet.tokenCode = 'token123';
const originalDate = new Date('2023-01-01T00:00:00Z');
parentWallet.lastUsedDate = originalDate;
parentWallet.balance = 0;
parentWallet.spentThisMonth = 0;
parentWallet.intersolveVisaChildWallets = [];

const newBalance = 150;
const newDate = new Date('2024-02-02T00:00:00Z');
const spentThisMonth = 50;

let customer = new IntersolveVisaCustomerEntity();
customer.intersolveVisaParentWallet = parentWallet;

describe('IntersolveVisaService', () => {
  let service: IntersolveVisaService;
  let apiService: IntersolveVisaApiService;
  let customerRepo: IntersolveVisaCustomerScopedRepository;
  let parentWalletRepo: IntersolveVisaParentWalletScopedRepository;
  let childWalletRepo: IntersolveVisaChildWalletScopedRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntersolveVisaService,
        {
          provide: IntersolveVisaApiService,
          useValue: {
            getToken: jest.fn(),
            getTransactionInformation: jest.fn(),
          },
        },
        {
          provide: IntersolveVisaCustomerScopedRepository,
          useValue: {
            findOneWithWalletsByRegistrationId: jest.fn(),
            findWithWallets: jest.fn(),
          },
        },
        {
          provide: IntersolveVisaParentWalletScopedRepository,
          useValue: {
            save: jest.fn(),
          },
        },
        {
          provide: IntersolveVisaChildWalletScopedRepository,
          useValue: {
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<IntersolveVisaService>(IntersolveVisaService);
    apiService = module.get(
      IntersolveVisaApiService,
    ) as jest.Mocked<IntersolveVisaApiService>;
    customerRepo = module.get(
      IntersolveVisaCustomerScopedRepository,
    ) as jest.Mocked<IntersolveVisaCustomerScopedRepository>;
    parentWalletRepo = module.get(
      IntersolveVisaParentWalletScopedRepository,
    ) as jest.Mocked<IntersolveVisaParentWalletScopedRepository>;
    childWalletRepo = module.get(
      IntersolveVisaChildWalletScopedRepository,
    ) as jest.Mocked<IntersolveVisaChildWalletScopedRepository>;

    // Set mocks
    jest
      .spyOn(customerRepo, 'findOneWithWalletsByRegistrationId')
      .mockResolvedValue(customer);

    jest.spyOn(parentWalletRepo, 'save').mockImplementation(async (w) => w);
    customer = structuredClone(customer);
  });

  describe('retrieveAndUpdateWallet', () => {
    it('should successfully retrieve and update wallet', async () => {
      jest.spyOn(apiService, 'getToken').mockResolvedValue({
        ...mockedToken,
        balance: newBalance,
      });
      jest.spyOn(apiService, 'getTransactionInformation').mockResolvedValue({
        lastTransactionDate: newDate,
        spentThisMonth,
      });

      const result = await service.retrieveAndUpdateWallet(registrationId);

      expect(result.lastUsedDate).toEqual(newDate);
      expect(result.balance).toBe(newBalance);
      expect(result.spentThisMonth).toBe(spentThisMonth);
    });

    it('should NOT update lastUsedDate if lastTransactionDate is null', async () => {
      jest.spyOn(apiService, 'getToken').mockResolvedValue(mockedToken);
      jest.spyOn(apiService, 'getTransactionInformation').mockResolvedValue({
        lastTransactionDate: null,
        spentThisMonth,
      });

      const result = await service.retrieveAndUpdateWallet(registrationId);

      expect(result.lastUsedDate).toEqual(originalDate);
      expect(result.spentThisMonth).toBe(spentThisMonth);
    });
  });

  describe('calculateTransferValueWithWalletRetrieval', () => {
    const registrationId = 123;
    const inputTransferValueInMajorUnit = 75;
    const newDate = new Date('2024-02-02T00:00:00Z');
    const spentThisMonth = 10000; // 10 euro in cents

    beforeEach(() => {
      jest.spyOn(apiService, 'getTransactionInformation').mockResolvedValue({
        lastTransactionDate: newDate,
        spentThisMonth,
      });
      jest.spyOn(apiService, 'getToken').mockResolvedValue({
        ...mockedToken,
      });
    });

    it('should use calculate transfer value for customer with parent and child wallet', async () => {
      // Arrange

      // Mock parent wallet before update
      const parentWallet = new IntersolveVisaParentWalletEntity();
      parentWallet.spentThisMonth = 0;
      parentWallet.balance = 0;
      parentWallet.tokenCode = 'parentToken';

      // Mock child wallet before update
      const childWallet = new IntersolveVisaChildWalletEntity();
      childWallet.tokenCode = 'childToken';

      parentWallet.intersolveVisaChildWallets = [childWallet];

      // Mock parent wallet update
      const customerWithParentWallet = new IntersolveVisaCustomerEntity();
      customerWithParentWallet.intersolveVisaParentWallet = parentWallet;

      jest
        .spyOn(customerRepo, 'findOneWithWalletsByRegistrationId')
        .mockResolvedValue(customerWithParentWallet);

      jest.spyOn(apiService, 'getTransactionInformation').mockResolvedValue({
        lastTransactionDate: newDate,
        spentThisMonth,
      });
      jest.spyOn(apiService, 'getToken').mockResolvedValue({
        ...mockedToken,
      });

      // Act
      const result = await service.calculateTransferValueWithWalletRetrieval({
        registrationId,
        inputTransferValueInMajorUnit,
      });

      // Assert
      // The expected value is calculated as follows:
      // For spentThisMonth = 10000 (100 euro), mockedToken.balance = 100 (1 euro), inputTransferValueInMajorUnit = 75:
      // Math.min(150 - (10000 + 100) / 100, 75) = Math.min(150 - 101, 75) = Math.min(49, 75) = 49
      const expected = 49;

      expect(result).toBe(expected);
    });

    it('should calculate transfer value if customer has a parent wallet without childwallets', async () => {
      // Arrange
      const parentWallet = new IntersolveVisaParentWalletEntity();
      parentWallet.spentThisMonth = 10;
      parentWallet.balance = 20;
      parentWallet.tokenCode = 'token';
      parentWallet.intersolveVisaChildWallets = [];

      const customerWithParentWallet = new IntersolveVisaCustomerEntity();
      customerWithParentWallet.intersolveVisaParentWallet = parentWallet;

      jest
        .spyOn(customerRepo, 'findOneWithWalletsByRegistrationId')
        .mockResolvedValue(customerWithParentWallet);

      jest.spyOn(apiService, 'getTransactionInformation').mockResolvedValue({
        lastTransactionDate: newDate,
        spentThisMonth,
      });
      jest.spyOn(apiService, 'getToken').mockResolvedValue({
        ...mockedToken,
      });

      // Act
      const result = await service.calculateTransferValueWithWalletRetrieval({
        registrationId,
        inputTransferValueInMajorUnit,
      });

      // Assert
      // The expected value should be the input amount as there are no earlier transactions to consider.
      expect(result).toBe(inputTransferValueInMajorUnit);
    });

    it('should calculate amount if customer has no parent wallet', async () => {
      // Arrange
      const customerWithoutParentWallet = new IntersolveVisaCustomerEntity();
      customerWithoutParentWallet.intersolveVisaParentWallet = undefined;

      jest
        .spyOn(customerRepo, 'findOneWithWalletsByRegistrationId')
        .mockResolvedValue(customerWithoutParentWallet);

      // Act
      const result = await service.calculateTransferValueWithWalletRetrieval({
        registrationId,
        inputTransferValueInMajorUnit,
      });

      // Assert
      // The expected value should be the input amount as there are no earlier transactions to consider.
      expect(result).toBe(inputTransferValueInMajorUnit);
    });
  });

  describe('retrieveAndUpdateAllWalletsAndCards', () => {
    const parentWallet = {
      intersolveVisaChildWallets: [
        {
          walletStatus: IntersolveVisaTokenStatus.Active,
          tokenCode: 'child1',
        },
      ],
    };
    const customers = [
      { registrationId: 1, intersolveVisaParentWallet: parentWallet },
      { registrationId: 2, intersolveVisaParentWallet: parentWallet },
    ];

    beforeEach(() => {
      jest
        .spyOn(customerRepo, 'findWithWallets')
        .mockResolvedValue(customers as any);
      jest
        .spyOn(parentWalletRepo, 'save')
        .mockResolvedValue(parentWallet as any);
      jest
        .spyOn(childWalletRepo, 'save')
        .mockResolvedValue(parentWallet.intersolveVisaChildWallets[0] as any);
      jest.spyOn(apiService, 'getToken').mockResolvedValue({
        status: IntersolveVisaTokenStatus.Active,
        blocked: false,
        balance: 100,
      });
      jest.spyOn(apiService, 'getTransactionInformation').mockResolvedValue({
        spentThisMonth: 0,
        lastTransactionDate: new Date(),
      });
    });

    it('should process all customers and update wallets', async () => {
      const result = await service.retrieveAndUpdateAllWalletsAndCards();

      expect(customerRepo.findWithWallets).toHaveBeenCalled();
      expect(childWalletRepo.save).toHaveBeenCalledTimes(2);
      expect(parentWalletRepo.save).toHaveBeenCalledTimes(2);
      expect(result).toBe(2);
    });

    it('should log and continue on IntersolveVisaApiError', async () => {
      // Override only the mocks that differ for this test
      const childWalletSaveMock = jest
        .spyOn(childWalletRepo, 'save')
        .mockResolvedValue(new IntersolveVisaChildWalletEntity() as any);

      jest
        .spyOn(apiService, 'getToken')
        .mockImplementationOnce(() => {
          throw new IntersolveVisaApiError('API error');
        })
        .mockResolvedValue({
          status: IntersolveVisaTokenStatus.Active,
          blocked: false,
          balance: 100,
        });

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.retrieveAndUpdateAllWalletsAndCards();

      expect(customerRepo.findWithWallets).toHaveBeenCalled();
      expect(childWalletSaveMock).toHaveBeenCalledTimes(1);
      expect(parentWalletRepo.save).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'IntersolveVisaApiError occurred while retrieving and updating wallets for customer:',
        1,
        'API error',
      );
      consoleErrorSpy.mockRestore();
    });
  });
});
