import { Repository } from 'typeorm';

import { Fsps } from '@121-service/src/fsp-integrations/shared/enum/fsp-name.enum';
import { ProgramFspConfigurationEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration.entity';
import { FspConfigurationStates } from '@121-service/src/program-fsp-configurations/enum/fsp-configuration-states.enum';
import { ProgramFspConfigurationRepository } from '@121-service/src/program-fsp-configurations/program-fsp-configurations.repository';

describe('ProgramFspConfigurationRepository', () => {
  let repository: ProgramFspConfigurationRepository;
  let baseRepository: jest.Mocked<Repository<ProgramFspConfigurationEntity>>;

  beforeEach(() => {
    baseRepository = {
      target: ProgramFspConfigurationEntity,
      manager: {} as any,
      queryRunner: undefined,
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<ProgramFspConfigurationEntity>>;

    repository = new ProgramFspConfigurationRepository(baseRepository);
  });

  describe('isFspConfiguredForProgram', () => {
    const programId = 1;
    const fspName = Fsps.cooperativeBankOfOromia;

    it('should return false if no configuration exists for the FSP', async () => {
      jest.spyOn(repository, 'getByProgramIdAndFspName').mockResolvedValue([]);

      const result = await repository.isFspConfiguredForProgram({
        programId,
        fspName,
      });

      expect(result).toBe(false);
    });

    it('should return false if configuration state is configuration-pending', async () => {
      const mockConfig = {
        id: 1,
        programId,
        fspName,
        state: FspConfigurationStates.configurationPending,
      } as ProgramFspConfigurationEntity;

      jest
        .spyOn(repository, 'getByProgramIdAndFspName')
        .mockResolvedValue([mockConfig]);

      const result = await repository.isFspConfiguredForProgram({
        programId,
        fspName,
      });

      expect(result).toBe(false);
    });

    it('should return true if configuration state is configured', async () => {
      const mockConfig = {
        id: 1,
        programId,
        fspName,
        state: FspConfigurationStates.configured,
      } as ProgramFspConfigurationEntity;

      jest
        .spyOn(repository, 'getByProgramIdAndFspName')
        .mockResolvedValue([mockConfig]);

      const result = await repository.isFspConfiguredForProgram({
        programId,
        fspName,
      });

      expect(result).toBe(true);
    });
  });
});
