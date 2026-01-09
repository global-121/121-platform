import { HttpException } from '@nestjs/common';

import * as fspSettingsHelpers from '@121-service/src/fsp-management/fsp-settings.helpers';
import { PaymentsHelperService } from '@121-service/src/payments/services/payments-helper.service';
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

  it('should throw if required properties are missing', async () => {
    (repo.findOne as jest.Mock).mockResolvedValueOnce({
      fspName: 'TestFsp',
      properties: [],
    });
    jest
      .spyOn(fspSettingsHelpers, 'getFspConfigurationRequiredProperties')
      .mockReturnValue(['prop1']);
    await expect(
      service.checkFspConfigurationsOrThrow(1, ['ConfigA']),
    ).rejects.toThrow(HttpException);
  });

  it('should not throw if all required properties are present', async () => {
    (repo.findOne as jest.Mock).mockResolvedValueOnce({
      fspName: 'TestFsp',
      properties: [{ name: 'prop1' }],
    });
    jest
      .spyOn(fspSettingsHelpers, 'getFspConfigurationRequiredProperties')
      .mockReturnValue(['prop1']);
    await expect(
      service.checkFspConfigurationsOrThrow(1, ['ConfigA']),
    ).resolves.toBeUndefined();
  });

  it('should not throw if FSP has no required configurations', async () => {
    (repo.findOne as jest.Mock).mockResolvedValueOnce({
      fspName: 'TestFsp',
      properties: [],
    });
    jest
      .spyOn(fspSettingsHelpers, 'getFspConfigurationRequiredProperties')
      .mockReturnValue([]);
    await expect(
      service.checkFspConfigurationsOrThrow(1, ['ConfigA']),
    ).resolves.toBeUndefined();
  });
});
