import { Logger } from '@nestjs/common';

import { FSP_ENV_VARIABLE_SETTINGS } from '@121-service/src/fsp-integrations/settings/fsp-env-variable-settings.const';
import { PaymentsModule } from '@121-service/src/payments/payments.module';
import { FspEnvVariableValidationService } from '@121-service/src/payments/services/fsp-env-variable-validation.service';

describe('PaymentsModule', () => {
  let paymentsModule: PaymentsModule;
  let fspEnvVariableValidationService: jest.Mocked<FspEnvVariableValidationService>;
  let logSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    fspEnvVariableValidationService = {
      validateFspEnvVariableSettings: jest.fn(),
    } as unknown as jest.Mocked<FspEnvVariableValidationService>;

    paymentsModule = new PaymentsModule(fspEnvVariableValidationService);

    logSpy = jest.spyOn(Logger.prototype, 'log');
    errorSpy = jest.spyOn(Logger.prototype, 'error');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onModuleInit', () => {
    it('should log success message when validation passes', () => {
      // Arrange
      fspEnvVariableValidationService.validateFspEnvVariableSettings.mockReturnValue(
        {
          ok: true,
          messages: ['no missing variables'],
        },
      );

      // Act
      paymentsModule.onModuleInit();

      // Assert
      expect(
        fspEnvVariableValidationService.validateFspEnvVariableSettings,
      ).toHaveBeenCalledWith({
        fspEnvVariableSettings: FSP_ENV_VARIABLE_SETTINGS,
      });
      expect(logSpy).toHaveBeenCalledWith(
        'FSP environment variable validation succeeded, no missing variables',
      );
    });

    it('should throw error and log error messages when validation fails', () => {
      // Arrange
      const errorMessages = ['error message 1', 'error message 2'];
      fspEnvVariableValidationService.validateFspEnvVariableSettings.mockReturnValue(
        {
          ok: false,
          messages: errorMessages,
        },
      );

      // Act & Assert
      expect(() => paymentsModule.onModuleInit()).toThrow(
        'FSP environment variable validation failed, see previously logged errors.',
      );
      expect(errorSpy).toHaveBeenCalledTimes(2);
      expect(errorSpy).toHaveBeenCalledWith(errorMessages[0]);
      expect(errorSpy).toHaveBeenCalledWith(errorMessages[1]);
    });
  });
});
