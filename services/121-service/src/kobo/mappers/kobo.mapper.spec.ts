import { KoboAssetDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-asset.dto';
import { KoboChoiceDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-choice.dto';
import { KoboSurveyItemDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-survey-item.dto';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
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

  const createFormDefinition = (
    overrides: Partial<KoboFormDefinition> = {},
  ): KoboFormDefinition => {
    return {
      name: 'Test Form',
      survey: [],
      languages: [],
      dateDeployed: new Date('2025-01-01'),
      versionId: 'v1',
      ...overrides,
    };
  };

  describe('form definition to entity', () => {
    it('should map form definition and parameters to entity data', () => {
      // Arrange
      const deployDate = new Date('2025-06-15T10:30:00Z');
      const formDefinition = createFormDefinition({
        dateDeployed: deployDate,
        versionId: 'v2.3.1',
      });
      const programId = 123;
      const assetUid = 'test-asset-uid';
      const token = 'test-token';
      const url = 'https://kobo.example.com';
      const name = '25042025 Prototype Sprint';
      const webhookAuthUsername = 'test-webhook-user';
      const webhookAuthPassword = 'test-webhook-pass';

      // Act
      const result = KoboMapper.formDefinitionToEntity({
        formDefinition,
        programId,
        assetUid,
        token,
        url,
        name,
        webhookAuthUsername,
        webhookAuthPassword,
      });

      // Assert
      expect(result).toEqual({
        programId,
        assetUid,
        token,
        url,
        dateDeployed: deployDate,
        versionId: formDefinition.versionId,
        name,
        webhookAuthUsername,
        webhookAuthPassword,
      });
    });
  });

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

    it('should handle undefined survey items with empty array default', () => {
      // Arrange
      const asset = createAsset({
        content: {
          survey: undefined,
        },
      });

      // Act
      const result = KoboMapper.koboAssetDtoToKoboFormDefinition({
        asset,
      });

      // Assert
      expect(result.survey).toEqual([]);
    });

    it('should normalize select_one type by stripping list name', () => {
      // Arrange
      const asset = createAsset({
        content: {
          survey: [
            createSurveyItem({
              name: 'gender',
              type: 'select_one gender_options',
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
      expect(result.survey[0].type).toBe('select_one');
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

      it('should handle undefined choices array with empty array default', () => {
        // Arrange
        const asset = createAsset({
          content: {
            survey: [
              createSurveyItem({
                name: 'testField',
                select_from_list_name: 'test_list',
              }),
            ],
            choices: undefined,
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

  describe('generic form properties', () => {
    it('should map form name, languages, dateDeployed, and versionId correctly', () => {
      // Arrange
      const deployDate = new Date('2025-06-15T10:30:00Z');
      const asset = createAsset({
        name: 'Health Survey 2025',
        content: {
          survey: [],
          choices: [],
        },
        summary: {
          languages: ['English (en)', 'Dutch (nl)'],
        },
        date_deployed: deployDate,
        version_id: 'v2.3.1',
      });

      // Act
      const result = KoboMapper.koboAssetDtoToKoboFormDefinition({
        asset,
      });

      // Assert
      expect(result.name).toBe('Health Survey 2025');
      expect(result.languages).toEqual(['English (en)', 'Dutch (nl)']);
      expect(result.dateDeployed).toBe(deployDate);
      expect(result.versionId).toBe('v2.3.1');
    });

    it('should handle missing or undefined form properties with appropriate defaults', () => {
      // Arrange
      const asset = createAsset({
        name: undefined,
        summary: {
          languages: undefined,
        },
      });

      // Act
      const result = KoboMapper.koboAssetDtoToKoboFormDefinition({
        asset,
      });

      // Assert
      expect(result.name).toBe('');
      expect(result.languages).toEqual([]);
    });
  });

  describe('submission to registration data', () => {
    const baseSubmission = {
      _id: 1,
      _xform_id_string: 'form-uuid',
      _submission_time: '2025-04-30T15:30:00.000Z',
      _status: 'submitted_via_web',
      __version__: 'v1',
    };

    it('should map submission with string, number, boolean values and special fields (happy flow)', () => {
      // Arrange
      const phoneNumber = '+31612345678';
      const age = 42;
      const isActive = true;
      const fspValue = 'Safaricom';
      const uuidValue = 'unique-submission-id';
      const groupField = 'some-value';

      const submission = {
        ...baseSubmission,
        _uuid: uuidValue,
        phoneNumber,
        age,
        isActive,
        fsp: fspValue,
        group_demographics: groupField,
      };

      // Act
      const result = KoboMapper.mapSubmissionToRegistrationData({
        koboSubmission: submission,
      });

      // Assert
      expect(result).toEqual({
        phoneNumber,
        age,
        isActive,
        programFspConfigurationName: fspValue,
        referenceId: uuidValue,
        group_demographics: groupField,
      });
    });

    it('should exclude all metadata fields', () => {
      // Arrange
      const refId = 'ref-id';
      const name = 'John Doe';

      const submission = {
        _id: 123,
        _uuid: refId,
        _xform_id_string: 'form-id',
        _submission_time: '2025-04-30T15:30:00.000Z',
        _status: 'submitted_via_web',
        __version__: 'v1',
        'formhub/uuid': 'formhub-id',
        start: '2025-04-30T15:29:00.000Z',
        end: '2025-04-30T15:30:00.000Z',
        'meta/instanceID': 'instance-id',
        _attachments: [],
        _geolocation: ['1.0', '2.0'],
        _tags: [],
        _notes: [],
        _validation_status: 'approved',
        _submitted_by: 'user123',
        name,
      };

      // Act
      const result = KoboMapper.mapSubmissionToRegistrationData({
        koboSubmission: submission,
      });

      // Assert
      expect(result).toEqual({
        referenceId: refId,
        name,
      });
    });

    it('should map fsp and _uuid fields to special attribute names', () => {
      // Arrange
      const fspValue = 'Iron Bank';
      const uuidValue = 'submission-uuid-12345';

      const submission = {
        ...baseSubmission,
        _uuid: uuidValue,
        fsp: fspValue,
      };

      // Act
      const result = KoboMapper.mapSubmissionToRegistrationData({
        koboSubmission: submission,
      });

      // Assert
      expect(result).toEqual({
        referenceId: uuidValue,
        programFspConfigurationName: fspValue,
      });
    });

    it('should throw error when submission contains unsupported type (array)', () => {
      // Arrange
      const unsupportedKey = 'attachmentList';
      const unsupportedValue = ['file1.pdf', 'file2.pdf'];

      const submission = {
        ...baseSubmission,
        _uuid: 'ref',
        phoneNumber: '+31612345678',
        [unsupportedKey]: unsupportedValue,
      };

      // Act & Assert
      expect(() =>
        KoboMapper.mapSubmissionToRegistrationData({
          koboSubmission: submission,
        }),
      ).toThrowErrorMatchingInlineSnapshot(
        `"Unsupported Kobo submission value type for key "attachmentList". Only string, number, and boolean values are allowed."`,
      );
    });
  });
});
