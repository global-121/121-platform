import { HttpException } from '@nestjs/common';

import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

describe('PaymentsHelperService', () => {
  let service: PaymentsHelperService;
  let repo: ProgramFspConfigurationRepository;

  beforeEach(() => {
    repo = {
      findOne: jest.fn(),
    } as unknown as ProgramFspConfigurationRepository;
    service = new PaymentsHelperService(repo);
  });

  it('should throw if a configuration is missing', async () => {
    (repo.findOne as jest.Mock).mockResolvedValueOnce(null);
    await expect(
      service.checkFspConfigurationsOrThrow(1, ['ConfigA']),
    ).rejects.toThrow(HttpException);
  });

  it('should throw if the configuration is not fully configured', async () => {
    (repo.findOne as jest.Mock).mockResolvedValueOnce({
      fspName: 'TestFsp',
      state: FspConfigurationStates.configurationPending,
    });
    await expect(
      service.checkFspConfigurationsOrThrow(1, ['ConfigA']),
    ).rejects.toThrow(HttpException);
  });

  it('should not throw if the configuration is configured', async () => {
    (repo.findOne as jest.Mock).mockResolvedValueOnce({
      fspName: 'TestFsp',
      state: FspConfigurationStates.configured,
    });
    await expect(
      service.checkFspConfigurationsOrThrow(1, ['ConfigA']),
    ).resolves.toBeUndefined();
  });
});
