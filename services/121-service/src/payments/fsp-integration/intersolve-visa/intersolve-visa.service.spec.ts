import { Test, TestingModule } from '@nestjs/testing';

import { IntersolveVisaCustomerEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-customer.entity';
import { IntersolveVisaParentWalletEntity } from '@121-service/src/payments/fsp-integration/intersolve-visa/entities/intersolve-visa-parent-wallet.entity';
import { IntersolveVisaTokenStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enums/intersolve-visa-token-status.enum';
import { IntersolveVisaApiService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.api.service';
import { IntersolveVisaService } from '@121-service/src/payments/fsp-integration/intersolve-visa/intersolve-visa.service';
import { IntersolveVisaChildWalletScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-child-wallet.scoped.repository';
import { IntersolveVisaCustomerScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-customer.scoped.repository';
import { IntersolveVisaParentWalletScopedRepository } from '@121-service/src/payments/fsp-integration/intersolve-visa/repositories/intersolve-visa-parent-wallet.scoped.repository';

const mockedToken = {
  blocked: false,
  status: IntersolveVisaTokenStatus.Active,
  balance: 100,
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
  // let childWalletRepo: IntersolveVisaChildWalletScopedRepository;

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

    // Set mocks
    jest
      .spyOn(customerRepo, 'findOneWithWalletsByRegistrationId')
      .mockResolvedValue(customer);

    jest.spyOn(parentWalletRepo, 'save').mockImplementation(async (w) => w);
    customer = structuredClone(customer);
  });

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
