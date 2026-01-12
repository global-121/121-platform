import { Test, TestingModule } from '@nestjs/testing';

import { ApproverSeedMode } from '@121-service/src/scripts/enum/approval-seed-mode.enum';
import { SeedScript } from '@121-service/src/scripts/enum/seed-script.enum';
import { ScriptsController } from '@121-service/src/scripts/scripts.controller';
import { ScriptsService } from '@121-service/src/scripts/services/scripts.service';

describe('ScriptsController - resetDb approverMode logic', () => {
  let controller: ScriptsController;
  let scriptsService: ScriptsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ScriptsController],
      providers: [
        {
          provide: ScriptsService,
          useValue: {
            loadSeedScenario: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<ScriptsController>(ScriptsController);
    scriptsService = module.get<ScriptsService>(ScriptsService);
  });

  function callResetDb({
    script,
    approverMode,
    mockPowerNumberRegistrations = '',
    includeRegistrationEvents = false,
    resetIdentifier = '',
    mockNumberPayments = '',
    mockPowerNumberMessages = '',
    mockPv = true,
    mockOcw = true,
    isApiTests = false,
  }: {
    script: SeedScript;
    approverMode: string;
    mockPowerNumberRegistrations?: string;
    includeRegistrationEvents?: boolean;
    resetIdentifier?: string;
    mockNumberPayments?: string;
    mockPowerNumberMessages?: string;
    mockPv?: boolean;
    mockOcw?: boolean;
    isApiTests?: boolean;
  }) {
    const res = { status: jest.fn().mockReturnThis(), send: jest.fn() };
    const baseBody = { secret: 'fill_in_secret' };
    return controller.resetDb(
      baseBody,
      script,
      mockPowerNumberRegistrations,
      includeRegistrationEvents,
      resetIdentifier,
      mockNumberPayments,
      mockPowerNumberMessages,
      mockPv,
      mockOcw,
      isApiTests,
      approverMode,
      res,
    );
  }

  describe('script nlrcMultipleMock', () => {
    const script = SeedScript.nlrcMultipleMock;

    it('should accept admin for nlrcMultipleMock', async () => {
      const approverMode = ApproverSeedMode.admin;
      await callResetDb({
        script,
        approverMode,
      });
      expect(scriptsService.loadSeedScenario).toHaveBeenCalledWith(
        expect.objectContaining({ approverMode: ApproverSeedMode.admin }),
      );
    });

    it('should accept empty for nlrcMultipleMock', async () => {
      const approverMode = '';
      await callResetDb({
        script,
        approverMode,
      });
      expect(scriptsService.loadSeedScenario).toHaveBeenCalledWith(
        expect.objectContaining({ approverMode: ApproverSeedMode.admin }),
      );
    });

    it('should throw for non-admin, non-empty approverMode for nlrcMultipleMock', async () => {
      const approverMode = ApproverSeedMode.demo;
      let thrownError;
      try {
        await callResetDb({
          script,
          approverMode,
        });
      } catch (err) {
        thrownError = err;
      }
      expect(thrownError).toBeDefined();
      expect(thrownError.message).toMatch(
        /NLRC multiple mock can only be seeded with admin approver mode/,
      );
      expect(thrownError.status).toBe(400);
    });
  });

  describe('other scripts', () => {
    const script = SeedScript.nlrcMultiple;

    it('should use provided valid approverMode for other scripts', async () => {
      const approverMode = ApproverSeedMode.demo;
      await callResetDb({
        script,
        approverMode,
      });
      expect(scriptsService.loadSeedScenario).toHaveBeenCalledWith(
        expect.objectContaining({ approverMode: ApproverSeedMode.demo }),
      );
    });

    it('should use default approverMode for other scripts if empty', async () => {
      const approverMode = '';
      // default is admin on development. We do not test separately for production by editing the global.IS_PRODUCTION.
      await callResetDb({
        script,
        approverMode,
      });
      expect(scriptsService.loadSeedScenario).toHaveBeenCalledWith(
        expect.objectContaining({ approverMode: ApproverSeedMode.admin }),
      );
    });

    it('should throw for unknown approverMode for other scripts', async () => {
      const approverMode = 'invalid-mode';
      let thrownError;
      try {
        await callResetDb({
          script,
          approverMode,
        });
      } catch (err) {
        thrownError = err;
      }
      expect(thrownError).toBeDefined();
      expect(thrownError.message).toMatch(/Unknown approverMode: invalid-mode/);
      expect(thrownError.status).toBe(400);
    });
  });
});
