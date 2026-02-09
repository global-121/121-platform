import { FspConfigurationProperties } from '@121-service/src/fsp-integrations/shared/enum/fsp-configuration-properties.enum';
import { parseFspConfigurationPropertyValue } from '@121-service/src/fsp-integrations/shared/helpers/parse-fsp-configuration-value.helper';

describe('parseFspConfigurationPropertyValue', () => {
  describe('boolean parsing', () => {
    it('should parse valid boolean values', () => {
      expect(
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.cardDistributionByMail,
          value: 'true',
        }),
      ).toBe(true);

      expect(
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.cardDistributionByMail,
          value: 'false',
        }),
      ).toBe(false);

      expect(
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.cardDistributionByMail,
          value: 'TRUE',
        }),
      ).toBe(true);

      expect(
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.cardDistributionByMail,
          value: 'FALSE',
        }),
      ).toBe(false);
    });

    it('should throw for invalid boolean values', () => {
      expect(() =>
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.cardDistributionByMail,
          value: 'yes',
        }),
      ).toThrow('Cannot parse value "yes" as boolean');

      expect(() =>
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.cardDistributionByMail,
          value: '1',
        }),
      ).toThrow('Cannot parse value "1" as boolean');

      expect(() =>
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.cardDistributionByMail,
          value: '',
        }),
      ).toThrow('Cannot parse value "" as boolean');
    });
  });

  describe('number parsing', () => {
    it('should parse valid number values', () => {
      expect(
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.maxToSpendPerMonthInCents,
          value: '123',
        }),
      ).toBe(123);

      expect(
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.maxToSpendPerMonthInCents,
          value: '-456',
        }),
      ).toBe(-456);

      expect(
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.maxToSpendPerMonthInCents,
          value: '123.45',
        }),
      ).toBe(123.45);
    });

    it('should throw for invalid number values', () => {
      expect(() =>
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.maxToSpendPerMonthInCents,
          value: 'abc',
        }),
      ).toThrow('Cannot parse value "abc" as number');

      expect(() =>
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.maxToSpendPerMonthInCents,
          value: '',
        }),
      ).toThrow('Cannot parse value "" as number');
    });
  });

  describe('array parsing', () => {
    it('should parse valid JSON array values', () => {
      expect(
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.brandCode,
          value: '["a","b","c"]',
        }),
      ).toEqual(['a', 'b', 'c']);

      expect(
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.brandCode,
          value: '[]',
        }),
      ).toEqual([]);

      expect(
        parseFspConfigurationPropertyValue({
          name: FspConfigurationProperties.brandCode,
          value: '["single"]',
        }),
      ).toEqual(['single']);
    });
  });
});
