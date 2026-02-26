import { Test, TestingModule } from '@nestjs/testing';

import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';
import { KoboSurveyProcessorService } from '@121-service/src/kobo/services/kobo-survey-processor.service';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

describe('KoboSurveyProcessorService', () => {
  let service: KoboSurveyProcessorService;

  const isRequired = true;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KoboSurveyProcessorService],
    }).compile();

    service = module.get<KoboSurveyProcessorService>(
      KoboSurveyProcessorService,
    );
  });

  describe('survey items processing', () => {
    it('should process a text field survey item into a program registration attribute', () => {
      // Arrange
      const fieldName = 'fullName';
      const fieldType = 'text';
      const labels = {
        en: 'What is your full name?',
        nl: 'Wat is je volledige naam?',
      };

      const koboSurveyItems: KoboSurveyItemCleaned[] = [
        {
          name: fieldName,
          type: fieldType,
          label: Object.values(labels),
          required: isRequired,
          choices: [],
        },
      ];

      const languageIsoCodes = [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ];

      // Act
      const result = service.surveyToProgramRegistrationAttributes({
        surveyItems: koboSurveyItems,
        languageIsoCodes,
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: fieldName,
        label: labels,
        type: RegistrationAttributeTypes.text,
        // Also validate the defeault values in this test
        isRequired,
        showInPeopleAffectedTable: true,
        editableInPortal: true,
        options: [],
      });
    });

    it('should process a number field survey item into a program registration attribute', () => {
      // Arrange
      const fieldName = 'age';
      const fieldType = 'integer';
      const labels = {
        en: 'What is your age?',
        nl: 'Wat is je leeftijd?',
      };
      const isRequired = true;

      const koboSurveyItems: KoboSurveyItemCleaned[] = [
        {
          name: fieldName,
          type: fieldType,
          label: Object.values(labels),
          required: isRequired,
          choices: [],
        },
      ];

      const languageIsoCodes = [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ];

      // Act
      const result = service.surveyToProgramRegistrationAttributes({
        surveyItems: koboSurveyItems,
        languageIsoCodes,
      });

      // Assert
      expect(result[0]).toMatchObject({
        name: fieldName,
        label: labels,
        type: RegistrationAttributeTypes.numeric,
      });
    });

    it('should fallback when no labels are provided', () => {
      // Arrange
      const fieldName = 'phoneNumber';
      const fieldType = 'text';
      const isRequired = false;

      const koboSurveyItems: KoboSurveyItemCleaned[] = [
        {
          name: fieldName,
          type: fieldType,
          // No label provided
          required: isRequired,
          choices: [],
        },
      ];

      const languageIsoCodes = [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ];

      // Act
      const result = service.surveyToProgramRegistrationAttributes({
        surveyItems: koboSurveyItems,
        languageIsoCodes,
      });

      // Assert
      expect(result[0]).toMatchObject({
        name: fieldName,
        label: {
          en: fieldName, // Fallback to field name
        },
      });
    });

    it('should skip unsupported field types', () => {
      // Arrange
      const supportedField = {
        name: 'supportedField',
        type: 'text',
        label: 'Supported field',
      };
      const unsupportedField = {
        name: 'unsupportedField',
        type: 'unsupported_type',
        kuid: 'pqr678',
        label: 'Unsupported field',
      };
      const isRequired = false;

      const koboSurveyItems: KoboSurveyItemCleaned[] = [
        {
          name: supportedField.name,
          type: supportedField.type,
          label: [supportedField.label],
          required: isRequired,
          choices: [],
        },
        {
          name: unsupportedField.name,
          type: unsupportedField.type,
          label: [unsupportedField.label],
          required: isRequired,
          choices: [],
        },
      ];

      const languageIsoCodes = [RegistrationPreferredLanguage.en];

      // Act
      const result = service.surveyToProgramRegistrationAttributes({
        surveyItems: koboSurveyItems,
        languageIsoCodes,
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(supportedField.name);
    });

    it('should skip items with empty string type', () => {
      // Arrange
      const fieldName = 'emptyTypeField';
      const fieldType = '';

      const koboSurveyItems: KoboSurveyItemCleaned[] = [
        {
          name: fieldName,
          type: fieldType,
          label: ['Empty type field'],
          required: false,
          choices: [],
        },
      ];

      const languageIsoCodes = [RegistrationPreferredLanguage.en];

      // Act
      const result = service.surveyToProgramRegistrationAttributes({
        surveyItems: koboSurveyItems,
        languageIsoCodes,
      });

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe('choices processing', () => {
    it('should process a dropdown field with choices into a program registration attribute', () => {
      // Arrange
      const fieldName = 'gender';
      const fieldType = 'select_one';
      const listName = 'gender_options';
      const labels = {
        en: 'What is your gender?',
        nl: 'Wat is je geslacht?',
      };
      const choices = {
        male: {
          name: 'male',
          kuid: 'choice1',
          labels: { en: 'Male', nl: 'Man' },
        },
        female: {
          name: 'female',
          kuid: 'choice2',
          labels: { en: 'Female', nl: 'Vrouw' },
        },
      };
      const isRequired = false;

      const koboSurveyItems: KoboSurveyItemCleaned[] = [
        {
          name: fieldName,
          type: fieldType,
          label: Object.values(labels),
          required: isRequired,
          choices: [
            {
              name: choices.male.name,
              label: Object.values(choices.male.labels),
              list_name: listName,
            },
            {
              name: choices.female.name,
              label: Object.values(choices.female.labels),
              list_name: listName,
            },
          ],
        },
      ];

      const languageIsoCodes = [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ];

      // Act
      const result = service.surveyToProgramRegistrationAttributes({
        surveyItems: koboSurveyItems,
        languageIsoCodes,
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: fieldName,
        label: labels,
        type: RegistrationAttributeTypes.dropdown,
        options: [
          {
            option: choices.male.name,
            label: choices.male.labels,
          },
          {
            option: choices.female.name,
            label: choices.female.labels,
          },
        ],
      });
    });

    it('should process multiple dropdown fields with different choice lists', () => {
      // Arrange
      const genderField = {
        name: 'gender',
        type: 'select_one',
        kuid: 'gender123',
        listName: 'gender_options',
        labels: { en: 'What is your gender?', nl: 'Wat is je geslacht?' },
      };

      const educationField = {
        name: 'education_level',
        type: 'select_one',
        kuid: 'edu456',
        listName: 'education_options',
        labels: {
          en: 'What is your education level?',
          nl: 'Wat is je opleidingsniveau?',
        },
      };

      const genderChoices = {
        male: {
          name: 'male',
          kuid: 'male1',
          labels: { en: 'Male', nl: 'Man' },
        },
        female: {
          name: 'female',
          kuid: 'female1',
          labels: { en: 'Female', nl: 'Vrouw' },
        },
      };

      const educationChoices = {
        primary: {
          name: 'primary',
          kuid: 'primary1',
          labels: { en: 'Primary', nl: 'Basisonderwijs' },
        },
      };

      const koboSurveyItems: KoboSurveyItemCleaned[] = [
        {
          name: genderField.name,
          type: genderField.type,
          label: Object.values(genderField.labels),
          required: false,
          choices: [
            {
              name: genderChoices.male.name,
              label: Object.values(genderChoices.male.labels),
              list_name: genderField.listName,
            },
            {
              name: genderChoices.female.name,
              label: Object.values(genderChoices.female.labels),
              list_name: genderField.listName,
            },
          ],
        },
        {
          name: educationField.name,
          type: educationField.type,
          label: Object.values(educationField.labels),
          required: true,
          choices: [
            {
              name: educationChoices.primary.name,
              label: Object.values(educationChoices.primary.labels),
              list_name: educationField.listName,
            },
          ],
        },
      ];

      const languageIsoCodes = [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ];

      // Act
      const result = service.surveyToProgramRegistrationAttributes({
        surveyItems: koboSurveyItems,
        languageIsoCodes,
      });

      // Assert
      expect(result).toHaveLength(2);

      // Find gender field result
      const genderResult = result.find(
        (attr) => attr.name === genderField.name,
      );
      expect(genderResult).toMatchObject({
        name: genderField.name,
        label: genderField.labels,
        type: RegistrationAttributeTypes.dropdown,
        options: [
          { option: genderChoices.male.name, label: genderChoices.male.labels },
          {
            option: genderChoices.female.name,
            label: genderChoices.female.labels,
          },
        ],
      });

      // Find education field result
      const educationResult = result.find(
        (attr) => attr.name === educationField.name,
      );
      expect(educationResult).toMatchObject({
        name: educationField.name,
        label: educationField.labels,
        type: RegistrationAttributeTypes.dropdown,
        options: [
          {
            option: educationChoices.primary.name,
            label: educationChoices.primary.labels,
          },
        ],
      });
    });
  });
});
