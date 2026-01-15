import { KoboAssetDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-asset.dto';
import { KoboChoiceDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-choice.dto';
import { KoboSurveyItemDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-survey-item.dto';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';
import { KoboMapper } from '@121-service/src/kobo/mappers/kobo.mapper';

describe('KoboMapper', () => {
  const createSurveyItem = (
    overrides: Partial<KoboSurveyItemDto> = {},
  ): KoboSurveyItemDto => {
    return {
      name: 'defaultName',
      type: 'text',
      label: ['Default label'],
      required: false,
      $kuid: 'default-kuid',
      $xpath: 'defaultName',
      $autoname: 'defaultName',
      ...overrides,
    };
  };

  const createChoice = (
    overrides: Partial<KoboChoiceDto> = {},
  ): KoboChoiceDto => {
    return {
      name: 'defaultChoice',
      label: ['Default choice label'],
      list_name: 'default_list',
      $kuid: 'default-choice-kuid',
      $autovalue: 'defaultChoice',
      ...overrides,
    };
  };

  const createAsset = (overrides: Partial<KoboAssetDto> = {}): KoboAssetDto => {
    return {
      name: 'Test Form',
      content: {
        survey: [],
        choices: [],
      },
      summary: {
        languages: [],
      },
      date_deployed: new Date('2025-01-01'),
      version_id: 'v1',
      ...overrides,
    };
  };

  describe('survey', () => {
    it('should transform survey items', () => {
      // Arrange
      const asset = createAsset({
        content: {
          survey: [
            createSurveyItem({
              name: 'fullName',
              label: ['What is your full name?'],
              required: true,
            }),
            createSurveyItem({
              name: 'phoneNumber',
              label: ['Phone number'],
              select_from_list_name: 'phone_list',
            }),
          ],
          choices: [],
        },
      });

      // Act
      const result = KoboMapper.koboAssetDtoToKoboFormDefinition({
        asset,
      });

      // Assert
      const expected: KoboSurveyItemCleaned[] = [
        {
          name: 'fullName',
          type: 'text',
          label: ['What is your full name?'],
          required: true,
          choices: [],
        },
        {
          name: 'phoneNumber',
          type: 'text',
          label: ['Phone number'],
          required: false,
          choices: [],
        },
      ];
      expect(result.survey).toEqual(expected);
    });

    it('should parse names with forward slashes correctly', () => {
      // Arrange
      const asset = createAsset({
        content: {
          survey: [
            createSurveyItem({
              name: 'group1/group2/fieldName',
            }),
            createSurveyItem({
              name: 'simple/field',
              type: 'integer',
            }),
          ],
          choices: [],
        },
      });

      // Act
      const result = KoboMapper.koboAssetDtoToKoboFormDefinition({
        asset,
      });

      // Assert
      expect(result.survey[0].name).toBe('fieldName');
      expect(result.survey[1].name).toBe('field');
      expect(result.survey[0].choices).toEqual([]);
      expect(result.survey[1].choices).toEqual([]);
      expect(result.survey).toHaveLength(2);
    });

    it('should use $autoname when name is not provided', () => {
      // Arrange
      const asset = createAsset({
        content: {
          survey: [
            createSurveyItem({
              name: undefined,
              $autoname: 'group/autoField',
            }),
          ],
          choices: [],
        },
      });

      // Act
      const result = KoboMapper.koboAssetDtoToKoboFormDefinition({
        asset,
      });

      // Assert
      expect(result.survey[0].name).toBe('autoField');
      expect(result.survey[0].choices).toEqual([]);
    });

    it('should return empty survey array for empty input', () => {
      // Arrange
      const asset = createAsset();

      // Act
      const result = KoboMapper.koboAssetDtoToKoboFormDefinition({
        asset,
      });

      // Assert
      expect(result.survey).toEqual([]);
    });

    describe('choices', () => {
      it('should map choices to survey items with matching select_from_list_name', () => {
        // Arrange
        const asset = createAsset({
          content: {
            survey: [
              createSurveyItem({
                name: 'favoriteColor',
                select_from_list_name: 'colors',
              }),
              createSurveyItem({
                name: 'favoriteSize',
                select_from_list_name: 'sizes',
              }),
              createSurveyItem({
                name: 'textField',
              }),
            ],
            choices: [
              createChoice({
                name: 'red',
                label: ['Red'],
                list_name: 'colors',
              }),
              createChoice({
                name: 'blue',
                label: ['Blue'],
                list_name: 'colors',
              }),
              createChoice({
                name: 'small',
                label: ['Small'],
                list_name: 'sizes',
              }),
            ],
          },
        });

        // Act
        const result = KoboMapper.koboAssetDtoToKoboFormDefinition({
          asset,
        });

        // Assert
        expect(result.survey[0].choices).toEqual([
          { name: 'red', label: ['Red'], list_name: 'colors' },
          { name: 'blue', label: ['Blue'], list_name: 'colors' },
        ]);
        expect(result.survey[1].choices).toEqual([
          { name: 'small', label: ['Small'], list_name: 'sizes' },
        ]);
      });

      it('should use correct fallbacks when choice name is not provided', () => {
        // Arrange
        const asset = createAsset({
          content: {
            survey: [
              createSurveyItem({
                name: 'question',
                select_from_list_name: 'test_list',
              }),
            ],
            choices: [
              createChoice({
                name: undefined,
                label: ['Choice without name'],
                list_name: 'test_list',
                $kuid: 'kuid-123',
                $autovalue: undefined,
              }),
              createChoice({
                name: undefined,
                label: ['Choice without name'],
                list_name: 'test_list',
                $kuid: 'kuid-456',
                $autovalue: 'autoGeneratedValue',
              }),
            ],
          },
        });

        // Act
        const result = KoboMapper.koboAssetDtoToKoboFormDefinition({
          asset,
        });

        // Assert
        expect(result.survey[0].choices[0].name).toBe('kuid-123');
        expect(result.survey[0].choices[1].name).toBe('autoGeneratedValue');
      });

      it('should return empty array when select_from_list_name has no matching choices', () => {
        // Arrange
        const asset = createAsset({
          content: {
            survey: [
              createSurveyItem({
                name: 'question',
                select_from_list_name: 'non_existent_list',
              }),
            ],
            choices: [
              createChoice({
                name: 'option1',
                list_name: 'different_list',
              }),
            ],
          },
        });

        // Act
        const result = KoboMapper.koboAssetDtoToKoboFormDefinition({
          asset,
        });

        // Assert
        expect(result.survey[0].choices).toEqual([]);
      });
    });
  });
});
