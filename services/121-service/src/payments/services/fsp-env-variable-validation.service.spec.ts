import { FspEnvVariablesDto } from '@121-service/src/fsp-integrations/shared/dto/fsp-env-variables.dto';
import { FspMode } from '@121-service/src/fsp-integrations/shared/enum/fsp-mode.enum';
import { FspEnvVariableValidationService } from '@121-service/src/payments/services/fsp-env-variable-validation.service';

describe('FSP environment variable validation', () => {
  const service = new FspEnvVariableValidationService();

  it('should return ok when there are no FSPs configured', () => {
    // Arrange
    const mockSettings: Record<string, FspEnvVariablesDto> = {};

    // Act
    const { ok, messages } = service.validateFspEnvVariableSettings({
      fspEnvVariableSettings: mockSettings as any,
    });

    // Assert
    expect(ok).toBe(true);
    expect(messages).toEqual(['no missing variables']);
  });

  describe('when FSP mode is "disabled" or "mock"', () => {
    it('should return ok when FSP is disabled', () => {
      // Arrange
      const mockSettings: Record<string, FspEnvVariablesDto> = {
        testFsp: {
          mode: FspMode.disabled,
          variables: {
            API_KEY: undefined,
            SECRET: undefined,
          },
        },
      };

      // Act
      const { ok, messages } = service.validateFspEnvVariableSettings({
        fspEnvVariableSettings: mockSettings as any,
      });

      // Assert
      expect(ok).toBe(true);
      expect(messages).toEqual(['no missing variables']);
    });

    it('should return ok when FSP is in mock mode', () => {
      // Arrange
      const mockSettings: Record<string, FspEnvVariablesDto> = {
        testFsp: {
          mode: FspMode.mock,
          variables: {
            API_KEY: undefined,
            SECRET: undefined,
          },
        },
      };

      // Act
      const { ok, messages } = service.validateFspEnvVariableSettings({
        fspEnvVariableSettings: mockSettings as any,
      });

      // Assert
      expect(ok).toBe(true);
      expect(messages).toEqual(['no missing variables']);
    });
  });

  describe('when FSP mode is "external"', () => {
    it('should return ok when all variables are set', () => {
      // Arrange
      const mockSettings: Record<string, FspEnvVariablesDto> = {
        testFsp: {
          mode: FspMode.external,
          variables: {
            API_KEY: 'some-api-key',
            SECRET: 'some-secret',
          },
        },
      };

      // Act
      const { ok, messages } = service.validateFspEnvVariableSettings({
        fspEnvVariableSettings: mockSettings as any,
      });

      // Assert
      expect(ok).toBe(true);
      expect(messages).toEqual(['no missing variables']);
    });

    it('should return not ok when missing environment variables', () => {
      // Arrange
      const mockSettings: Record<string, FspEnvVariablesDto> = {
        testFsp: {
          mode: FspMode.external,
          variables: {
            API_KEY: undefined,
            SECRET: 'some-secret',
          },
        },
      };

      // Act
      const { ok, messages } = service.validateFspEnvVariableSettings({
        fspEnvVariableSettings: mockSettings as any,
      });

      // Assert
      expect(ok).toBe(false);
      expect(messages).toContain(
        'FSP "testFsp" is enabled using "{FSP}_MODE=EXTERNAL", but is missing the following required environment variables: "API_KEY".',
      );
    });

    it('should include all missing variable names when multiple variables are missing', () => {
      // Arrange
      const mockSettings: Record<string, FspEnvVariablesDto> = {
        testFsp: {
          mode: FspMode.external,
          variables: {
            API_KEY: undefined,
            SECRET: undefined,
            ENDPOINT: undefined,
          },
        },
      };

      // Act
      const { ok, messages } = service.validateFspEnvVariableSettings({
        fspEnvVariableSettings: mockSettings as any,
      });

      // Assert
      expect(ok).toBe(false);
      expect(messages).toContain(
        'FSP "testFsp" is enabled using "{FSP}_MODE=EXTERNAL", but is missing the following required environment variables: "API_KEY", "SECRET", "ENDPOINT".',
      );
    });

    it('should handle null values as missing variables', () => {
      // Arrange
      const mockSettings: Record<string, FspEnvVariablesDto> = {
        testFsp: {
          mode: FspMode.external,
          variables: {
            API_KEY: null as unknown as undefined,
          },
        },
      };

      // Act
      const { ok, messages } = service.validateFspEnvVariableSettings({
        fspEnvVariableSettings: mockSettings as any,
      });

      // Assert
      expect(ok).toBe(false);
      expect(messages).toContain(
        'FSP "testFsp" is enabled using "{FSP}_MODE=EXTERNAL", but is missing the following required environment variables: "API_KEY".',
      );
    });

    it('should validate multiple FSPs independently', () => {
      // Arrange
      const mockSettings: Record<string, FspEnvVariablesDto> = {
        enabledFsp: {
          mode: FspMode.external,
          variables: {
            API_KEY: 'valid-key',
          },
        },
        disabledFsp: {
          mode: FspMode.disabled,
          variables: {
            API_KEY: undefined,
          },
        },
      };

      // Act
      const { ok, messages } = service.validateFspEnvVariableSettings({
        fspEnvVariableSettings: mockSettings as any,
      });

      // Assert
      expect(ok).toBe(true);
      expect(messages).toEqual(['no missing variables']);
    });

    it('should return messages for all FSPs with missing variables when multiple FSPs are enabled', () => {
      // Arrange
      const mockSettings: Record<string, FspEnvVariablesDto> = {
        fspOne: {
          mode: FspMode.external,
          variables: {
            API_KEY: undefined,
          },
        },
        fspTwo: {
          mode: FspMode.external,
          variables: {
            SECRET: undefined,
          },
        },
      };

      // Act
      const { ok, messages } = service.validateFspEnvVariableSettings({
        fspEnvVariableSettings: mockSettings as any,
      });

      // Assert
      expect(ok).toBe(false);
      expect(messages).toHaveLength(2);
      expect(messages).toContain(
        'FSP "fspOne" is enabled using "{FSP}_MODE=EXTERNAL", but is missing the following required environment variables: "API_KEY".',
      );
      expect(messages).toContain(
        'FSP "fspTwo" is enabled using "{FSP}_MODE=EXTERNAL", but is missing the following required environment variables: "SECRET".',
      );
    });

    it('an empty string is a not valid value', () => {
      // Arrange
      const mockSettings: Record<string, FspEnvVariablesDto> = {
        testFsp: {
          mode: FspMode.external,
          variables: {
            API_KEY: '',
          },
        },
      };

      // Act
      const { ok, messages } = service.validateFspEnvVariableSettings({
        fspEnvVariableSettings: mockSettings as any,
      });

      // Assert
      expect(ok).toBe(false);
      expect(messages).toContain(
        'FSP "testFsp" is enabled using "{FSP}_MODE=EXTERNAL", but is missing the following required environment variables: "API_KEY".',
      );
    });

    it('boolean false is a valid value', () => {
      // Arrange
      const mockSettings: Record<string, FspEnvVariablesDto> = {
        testFsp: {
          mode: FspMode.external,
          variables: {
            FEATURE_FLAG: false,
          },
        },
      };

      // Act
      const { ok } = service.validateFspEnvVariableSettings({
        fspEnvVariableSettings: mockSettings as any,
      });

      // Assert
      expect(ok).toBe(true);
    });

    it('number 0 is a valid value', () => {
      // Arrange
      const mockSettings: Record<string, FspEnvVariablesDto> = {
        testFsp: {
          mode: FspMode.external,
          variables: {
            TIMEOUT: 0,
          },
        },
      };

      // Act
      const { ok } = service.validateFspEnvVariableSettings({
        fspEnvVariableSettings: mockSettings as any,
      });

      // Assert
      expect(ok).toBe(true);
    });
  });
});
