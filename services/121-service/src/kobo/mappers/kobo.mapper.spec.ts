import { KoboSurveyItemDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-survey-item.dto';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';
import { KoboMapper } from '@121-service/src/kobo/mappers/kobo.mapper';

describe('KoboMapper', () => {
  describe('surveyItemsDtosToInterfaces', () => {
    it('should transform survey items', () => {
      // Arrange
      const koboSurveyItems: KoboSurveyItemDto[] = [
        {
          name: 'fullName',
          type: 'text',
          label: ['What is your full name?'],
          required: true,
          $kuid: 'abc123',
          $xpath: 'fullName',
          $autoname: 'fullName',
        },
        {
          name: 'phoneNumber',
          type: 'text',
          label: ['Phone number'],
          required: false,
          select_from_list_name: 'phone_list',
          $kuid: 'def456',
          $xpath: 'phoneNumber',
          $autoname: 'phoneNumber',
        },
      ];

      // Act
      const result = KoboMapper.surveyItemsDtosToInterfaces({
        koboSurveyItems,
      });

      // Assert
      const expected: KoboSurveyItemCleaned[] = [
        {
          name: 'fullName',
          type: 'text',
          label: ['What is your full name?'],
          required: true,
          select_from_list_name: undefined,
        },
        {
          name: 'phoneNumber',
          type: 'text',
          label: ['Phone number'],
          required: false,
          select_from_list_name: 'phone_list',
        },
      ];
      expect(result).toEqual(expected);
    });

    it('should parse names with forward slashes correctly', () => {
      // Arrange
      const koboSurveyItems: KoboSurveyItemDto[] = [
        {
          name: 'group1/group2/fieldName',
          type: 'text',
          label: ['Test field'],
          required: true,
          $kuid: 'ghi789',
          $xpath: 'group1/group2/fieldName',
          $autoname: 'group1/group2/fieldName',
        },
        {
          name: 'simple/field',
          type: 'integer',
          label: ['Simple field'],
          required: false,
          $kuid: 'jkl012',
          $xpath: 'simple/field',
          $autoname: 'simple/field',
        },
      ];

      // Act
      const result = KoboMapper.surveyItemsDtosToInterfaces({
        koboSurveyItems,
      });

      // Assert
      expect(result[0].name).toBe('fieldName');
      expect(result[1].name).toBe('field');
      expect(result).toHaveLength(2);
    });

    it('should use $autoname when name is not provided', () => {
      // Arrange
      const koboSurveyItems: KoboSurveyItemDto[] = [
        {
          type: 'text',
          label: ['Auto named field'],
          required: true,
          $kuid: 'mno345',
          $xpath: 'autoField',
          $autoname: 'group/autoField',
        },
      ];

      // Act
      const result = KoboMapper.surveyItemsDtosToInterfaces({
        koboSurveyItems,
      });

      // Assert
      expect(result[0].name).toBe('autoField');
    });

    it('should handle deeply nested paths', () => {
      // Arrange
      const koboSurveyItems: KoboSurveyItemDto[] = [
        {
          name: 'level1/level2/level3/level4/finalField',
          type: 'select_one',
          label: ['Deeply nested field'],
          required: false,
          select_from_list_name: 'options',
          $kuid: 'pqr678',
          $xpath: 'level1/level2/level3/level4/finalField',
          $autoname: 'level1/level2/level3/level4/finalField',
        },
      ];

      // Act
      const result = KoboMapper.surveyItemsDtosToInterfaces({
        koboSurveyItems,
      });

      // Assert
      expect(result[0].name).toBe('finalField');
      expect(result[0].select_from_list_name).toBe('options');
    });

    it('should return empty array for empty input', () => {
      // Act
      const result = KoboMapper.surveyItemsDtosToInterfaces({
        koboSurveyItems: [],
      });

      // Assert
      expect(result).toEqual([]);
    });
  });
});
