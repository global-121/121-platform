import { Test, TestingModule } from '@nestjs/testing';

import { IntersolveVoucherJobName } from '@121-service/src/payments/fsp-integration/intersolve-voucher/dto/job-details.dto';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/entities/intersolve-voucher.entity';
import { IntersolveVoucherService } from '@121-service/src/payments/fsp-integration/intersolve-voucher/services/intersolve-voucher.service';
import { IntersolveVoucherReconciliationService } from '@121-service/src/payments/reconciliation/intersolve-voucher-reconciliation/intersolve-voucher-reconciliation.service';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';
import { ProgramRepository } from '@121-service/src/programs/repositories/program.repository';
import { getScopedRepositoryProviderName } from '@121-service/src/utils/scope/createScopedRepositoryProvider.helper';

const mockVoucherService = { getAndUpdateBalance: jest.fn() };
const mockProgramRepo = { find: jest.fn() };
const mockFspConfigRepo = {
  getUsernamePasswordPropertiesByVoucherId: jest.fn(),
};
const mockVoucherScopedRepo = {
  createQueryBuilder: jest.fn(),
};

function mockQueryBuilder(results: any[]) {
  return {
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest
      .fn()
      .mockResolvedValue({ max: results.length ? results.length : undefined }),
    getMany: jest.fn().mockResolvedValue(results),
  };
}

describe('IntersolveVoucherReconciliationService', () => {
  let service: IntersolveVoucherReconciliationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntersolveVoucherReconciliationService,
        { provide: IntersolveVoucherService, useValue: mockVoucherService },
        { provide: ProgramRepository, useValue: mockProgramRepo },
        {
          provide: ProgramFspConfigurationRepository,
          useValue: mockFspConfigRepo,
        },
        {
          provide: getScopedRepositoryProviderName(IntersolveVoucherEntity),
          useValue: mockVoucherScopedRepo,
        },
      ],
    }).compile();
    service = module.get(IntersolveVoucherReconciliationService);
  });

  it('should call updateVouchersWithErrorHandling in getAndUpdateBalancesForProgram', async () => {
    const vouchers = [{ id: 1 }];
    mockVoucherScopedRepo.createQueryBuilder.mockReturnValue(
      mockQueryBuilder(vouchers),
    );
    mockFspConfigRepo.getUsernamePasswordPropertiesByVoucherId.mockResolvedValue(
      {},
    );
    mockVoucherService.getAndUpdateBalance.mockResolvedValue(undefined);
    await expect(
      service.getAndUpdateBalancesForProgram(
        1,
        IntersolveVoucherJobName.getLatestVoucherBalance,
      ),
    ).resolves.not.toThrow();
  });

  it('should throw after 10 errors in updateVouchersWithErrorHandling', async () => {
    const vouchers = Array.from({ length: 11 }, (_, i) => ({
      id: i + 1,
    })) as unknown as IntersolveVoucherEntity[];
    mockVoucherService.getAndUpdateBalance.mockRejectedValue(new Error('fail'));
    await expect(
      // @ts-expect-error: test private method
      service.updateVouchersWithErrorHandling(
        vouchers,
        1,
        {},
        'Test error prefix:',
        true,
      ),
    ).rejects.toThrow(/Test error prefix: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10/);
  });

  it('should not throw if fewer than 10 errors in updateVouchersWithErrorHandling', async () => {
    const vouchers = Array.from({ length: 9 }, (_, i) => ({
      id: i + 1,
    })) as unknown as IntersolveVoucherEntity[];
    mockVoucherService.getAndUpdateBalance.mockRejectedValue(new Error('fail'));
    await expect(
      // @ts-expect-error: test private method
      service.updateVouchersWithErrorHandling(
        vouchers,
        1,
        {},
        'Test error prefix:',
        true,
      ),
    ).resolves.toBe(9);
  });
});
