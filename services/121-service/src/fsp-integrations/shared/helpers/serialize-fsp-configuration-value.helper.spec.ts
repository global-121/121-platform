import { serializeFspConfigurationPropertyValue } from '@121-service/src/fsp-integrations/shared/helpers/serialize-fsp-configuration-value.helper';

describe('serializeFspConfigurationPropertyValue', () => {
  it('should serialize boolean to string', () => {
    expect(serializeFspConfigurationPropertyValue(true)).toBe('true');
    expect(serializeFspConfigurationPropertyValue(false)).toBe('false');
  });

  it('should serialize number to string', () => {
    expect(serializeFspConfigurationPropertyValue(123)).toBe('123');
    expect(serializeFspConfigurationPropertyValue(0)).toBe('0');
  });

  it('should return string as-is', () => {
    expect(serializeFspConfigurationPropertyValue('hello')).toBe('hello');
  });

  it('should return string array as-is', () => {
    expect(serializeFspConfigurationPropertyValue(['a', 'b'])).toBe(
      '["a","b"]',
    );
  });
});
