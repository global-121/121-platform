import { Test, TestingModule } from '@nestjs/testing';

import { KoboChoiceDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-choice.dto';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';
import { KoboSurveyProcessorService } from '@121-service/src/kobo/services/kobo-survey-processor.service';
import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

describe('KoboSurveyProcessorService', () => {
  let service: KoboSurveyProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [KoboSurveyProcessorService],
    }).compile();

    service = module.get<KoboSurveyProcessorService>(
      KoboSurveyProcessorService,
    );
  });

  describe('surveyToProgramRegistrationAttributes', () => {
    it('should process a text field survey item into a program registration attribute', () => {
      // Arrange
      const fieldName = 'fullName';
      const fieldType = 'text';
      const labels = {
        en: 'What is your full name?',
        nl: 'Wat is je volledige naam?',
      };
      const isRequired = true;

      const koboSurveyItems: KoboSurveyItemCleaned[] = [
        {
          name: fieldName,
          type: fieldType,
          label: Object.values(labels),
          required: isRequired,
        },
      ];

      const koboChoices: KoboChoiceDto[] = [];

      const languageIsoCodes = [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ];

      // Act
      const result = service.surveyToProgramRegistrationAttributes({
        koboSurvey: koboSurveyItems,
        koboChoices,
        languageIsoCodes,
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: fieldName,
        label: labels,
        type: RegistrationAttributeTypes.text,
        isRequired,
        showInPeopleAffectedTable: true,
        editableInPortal: true,
        options: undefined,
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
        },
      ];

      const koboChoices: KoboChoiceDto[] = [];

      const languageIsoCodes = [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ];

      // Act
      const result = service.surveyToProgramRegistrationAttributes({
        koboSurvey: koboSurveyItems,
        koboChoices,
        languageIsoCodes,
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: fieldName,
        label: labels,
        type: RegistrationAttributeTypes.numeric,
        isRequired,
        showInPeopleAffectedTable: true,
        editableInPortal: true,
        options: undefined,
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
        },
      ];

      const koboChoices: KoboChoiceDto[] = [];

      const languageIsoCodes = [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ];

      // Act
      const result = service.surveyToProgramRegistrationAttributes({
        koboSurvey: koboSurveyItems,
        koboChoices,
        languageIsoCodes,
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: fieldName,
        label: {
          en: fieldName, // Fallback to field name
        },
        type: RegistrationAttributeTypes.text,
        isRequired,
        showInPeopleAffectedTable: true,
        editableInPortal: true,
        options: undefined,
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
        },
        {
          name: unsupportedField.name,
          type: unsupportedField.type,
          label: [unsupportedField.label],
          required: isRequired,
        },
      ];

      const koboChoices: KoboChoiceDto[] = [];

      const languageIsoCodes = [RegistrationPreferredLanguage.en];

      // Act
      const result = service.surveyToProgramRegistrationAttributes({
        koboSurvey: koboSurveyItems,
        koboChoices,
        languageIsoCodes,
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(supportedField.name);
    });
  });

  describe('dropdown fields with choices', () => {
    it('should process a dropdown field with choices into a program registration attribute', () => {
      // Arrange
      const fieldName = 'gender';
      const fieldType = 'select_one gender_options';
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
          select_from_list_name: listName,
        },
      ];

      const koboChoices: KoboChoiceDto[] = [
        {
          name: choices.male.name,
          $kuid: choices.male.kuid,
          label: Object.values(choices.male.labels),
          list_name: listName,
          $autovalue: choices.male.name,
        },
        {
          name: choices.female.name,
          $kuid: choices.female.kuid,
          label: Object.values(choices.female.labels),
          list_name: listName,
          $autovalue: choices.female.name,
        },
      ];

      const languageIsoCodes = [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ];

      // Act
      const result = service.surveyToProgramRegistrationAttributes({
        koboSurvey: koboSurveyItems,
        koboChoices,
        languageIsoCodes,
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: fieldName,
        label: labels,
        type: RegistrationAttributeTypes.dropdown,
        isRequired,
        showInPeopleAffectedTable: true,
        editableInPortal: true,
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
        type: 'select_one gender_options',
        kuid: 'gender123',
        listName: 'gender_options',
        labels: { en: 'What is your gender?', nl: 'Wat is je geslacht?' },
      };

      const educationField = {
        name: 'education_level',
        type: 'select_one education_options',
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
          select_from_list_name: genderField.listName,
        },
        {
          name: educationField.name,
          type: educationField.type,
          label: Object.values(educationField.labels),
          required: true,
          select_from_list_name: educationField.listName,
        },
      ];

      const koboChoices: KoboChoiceDto[] = [
        {
          name: genderChoices.male.name,
          $kuid: genderChoices.male.kuid,
          label: Object.values(genderChoices.male.labels),
          list_name: genderField.listName,
          $autovalue: genderChoices.male.name,
        },
        {
          name: genderChoices.female.name,
          $kuid: genderChoices.female.kuid,
          label: Object.values(genderChoices.female.labels),
          list_name: genderField.listName,
          $autovalue: genderChoices.female.name,
        },

        {
          name: educationChoices.primary.name,
          $kuid: educationChoices.primary.kuid,
          label: Object.values(educationChoices.primary.labels),
          list_name: educationField.listName,
          $autovalue: educationChoices.primary.name,
        },
      ];

      const languageIsoCodes = [
        RegistrationPreferredLanguage.en,
        RegistrationPreferredLanguage.nl,
      ];

      // Act
      const result = service.surveyToProgramRegistrationAttributes({
        koboSurvey: koboSurveyItems,
        koboChoices,
        languageIsoCodes,
      });

      // Assert
      expect(result).toHaveLength(2);

      // Find gender field result
      const genderResult = result.find(
        (attr) => attr.name === genderField.name,
      );
      expect(genderResult).toEqual({
        name: genderField.name,
        label: genderField.labels,
        type: RegistrationAttributeTypes.dropdown,
        isRequired: false,
        showInPeopleAffectedTable: true,
        editableInPortal: true,
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
      expect(educationResult).toEqual({
        name: educationField.name,
        label: educationField.labels,
        type: RegistrationAttributeTypes.dropdown,
        isRequired: true,
        showInPeopleAffectedTable: true,
        editableInPortal: true,
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
