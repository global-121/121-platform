import { FspEnvVariablesDto } from '@121-service/src/fsp-integrations/shared/dto/fsp-env-variables.dto';
import { FspEnvVariableValidationService } from '@121-service/src/payments/services/fsp-env-variable-validation.service';

describe('FSP environment variable validation', () => {
  const service = new FspEnvVariableValidationService();

  it('should return ok when FSP is disabled', () => {
    // Arrange
    const mockSettings: Record<string, FspEnvVariablesDto> = {
      testFsp: {
        enabled: false,
        variables: {
          API_KEY: undefined,
          SECRET: undefined,
        },
      },
    };

    // Act
    const result = service.validateFspEnvVariableSettings({
      fspEnvVariableSettings: mockSettings as any,
    });

    // Assert
    expect(result.ok).toBe(true);
    expect(result.messages).toEqual(['no missing variables']);
  });

  it('should return ok when FSP is enabled and all variables are set', () => {
    // Arrange
    const mockSettings: Record<string, FspEnvVariablesDto> = {
      testFsp: {
        enabled: true,
        variables: {
          API_KEY: 'some-api-key',
          SECRET: 'some-secret',
        },
      },
    };

    // Act
    const result = service.validateFspEnvVariableSettings({
      fspEnvVariableSettings: mockSettings as any,
    });

    // Assert
    expect(result.ok).toBe(true);
    expect(result.messages).toEqual(['no missing variables']);
  });

  it('should return not ok when FSP is enabled but has missing environment variables', () => {
    // Arrange
    const mockSettings: Record<string, FspEnvVariablesDto> = {
      testFsp: {
        enabled: true,
        variables: {
          API_KEY: undefined,
          SECRET: 'some-secret',
        },
      },
    };

    // Act
    const result = service.validateFspEnvVariableSettings({
      fspEnvVariableSettings: mockSettings as any,
    });

    // Assert
    expect(result.ok).toBe(false);
    expect(result.messages).toContain(
      'FSP "testFsp" is enabled using "{FSP}_ENABLED", but is missing the following required environment variables: "API_KEY".',
    );
  });

  it('should include all missing variable names when multiple variables are missing', () => {
    // Arrange
    const mockSettings: Record<string, FspEnvVariablesDto> = {
      testFsp: {
        enabled: true,
        variables: {
          API_KEY: undefined,
          SECRET: undefined,
          ENDPOINT: null as unknown as undefined,
        },
      },
    };

    // Act
    const result = service.validateFspEnvVariableSettings({
      fspEnvVariableSettings: mockSettings as any,
    });

    // Assert
    expect(result.ok).toBe(false);
    expect(result.messages).toContain(
      'FSP "testFsp" is enabled using "{FSP}_ENABLED", but is missing the following required environment variables: "API_KEY", "SECRET", "ENDPOINT".',
    );
  });

  it('should handle null values as missing variables', () => {
    // Arrange
    const mockSettings: Record<string, FspEnvVariablesDto> = {
      testFsp: {
        enabled: true,
        variables: {
          API_KEY: null as unknown as undefined,
        },
      },
    };

    // Act
    const result = service.validateFspEnvVariableSettings({
      fspEnvVariableSettings: mockSettings as any,
    });

    // Assert
    expect(result.ok).toBe(false);
    expect(result.messages).toContain(
      'FSP "testFsp" is enabled using "{FSP}_ENABLED", but is missing the following required environment variables: "API_KEY".',
    );
  });

  it('should validate multiple FSPs independently', () => {
    // Arrange
    const mockSettings: Record<string, FspEnvVariablesDto> = {
      enabledFsp: {
        enabled: true,
        variables: {
          API_KEY: 'valid-key',
        },
      },
      disabledFsp: {
        enabled: false,
        variables: {
          API_KEY: undefined,
        },
      },
    };

    // Act
    const result = service.validateFspEnvVariableSettings({
      fspEnvVariableSettings: mockSettings as any,
    });

    // Assert
    expect(result.ok).toBe(true);
    expect(result.messages).toEqual(['no missing variables']);
  });

  it('should return messages for all FSPs with missing variables when multiple FSPs are enabled', () => {
    // Arrange
    const mockSettings: Record<string, FspEnvVariablesDto> = {
      fspOne: {
        enabled: true,
        variables: {
          API_KEY: undefined,
        },
      },
      fspTwo: {
        enabled: true,
        variables: {
          SECRET: undefined,
        },
      },
    };

    // Act
    const result = service.validateFspEnvVariableSettings({
      fspEnvVariableSettings: mockSettings as any,
    });

    // Assert
    expect(result.ok).toBe(false);
    expect(result.messages).toHaveLength(2);
    expect(result.messages).toContain(
      'FSP "fspOne" is enabled using "{FSP}_ENABLED", but is missing the following required environment variables: "API_KEY".',
    );
    expect(result.messages).toContain(
      'FSP "fspTwo" is enabled using "{FSP}_ENABLED", but is missing the following required environment variables: "SECRET".',
    );
  });

  it('an empty string is a not valid value', () => {
    // Arrange
    const mockSettings: Record<string, FspEnvVariablesDto> = {
      testFsp: {
        enabled: true,
        variables: {
          API_KEY: '',
        },
      },
    };

    // Act
    const result = service.validateFspEnvVariableSettings({
      fspEnvVariableSettings: mockSettings as any,
    });

    // Assert
    expect(result.ok).toBe(false);
    expect(result.messages).toContain(
      'FSP "testFsp" is enabled using "{FSP}_ENABLED", but is missing the following required environment variables: "API_KEY".',
    );
  });

  it('boolean false is a valid value', () => {
    // Arrange
    const mockSettings: Record<string, FspEnvVariablesDto> = {
      testFsp: {
        enabled: true,
        variables: {
          FEATURE_FLAG: false,
        },
      },
    };

    // Act
    const result = service.validateFspEnvVariableSettings({
      fspEnvVariableSettings: mockSettings as any,
    });

    // Assert
    expect(result.ok).toBe(true);
  });

  it('number 0 is a valid value', () => {
    // Arrange
    const mockSettings: Record<string, FspEnvVariablesDto> = {
      testFsp: {
        enabled: true,
        variables: {
          TIMEOUT: 0,
        },
      },
    };

    // Act
    const result = service.validateFspEnvVariableSettings({
      fspEnvVariableSettings: mockSettings as any,
    });

    // Assert
    expect(result.ok).toBe(true);
  });

  it('should return ok when there are no FSPs configured', () => {
    // Arrange
    const mockSettings: Record<string, FspEnvVariablesDto> = {};

    // Act
    const result = service.validateFspEnvVariableSettings({
      fspEnvVariableSettings: mockSettings as any,
    });

    // Assert
    expect(result.ok).toBe(true);
    expect(result.messages).toEqual(['no missing variables']);
  });
});
