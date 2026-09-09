import { ActivityInfoRecordDto } from '@121-service/src/activityinfo/dtos/activityinfo-api/activityinfo-record.dto';
import { ActivityInfoChoiceCleaned } from '@121-service/src/activityinfo/interfaces/activityinfo-choice-cleaned.interface';
import { ActivityInfoRegistrationInput } from '@121-service/src/activityinfo/interfaces/activityinfo-registration-input.interface';
import { ACTIVITY_INFO_RECORD_ID_ALIAS } from '@121-service/src/activityinfo/services/activityinfo-api.service';

export interface ActivityInfoFieldMapping {
  attributeName: string;
  choices: ActivityInfoChoiceCleaned[];
}

export class ActivityInfoRecordMapper {
  public static mapRecordToRegistrationData({
    record,
    fieldMappingsByFieldId,
  }: {
    record: ActivityInfoRecordDto;
    fieldMappingsByFieldId: Map<string, ActivityInfoFieldMapping>;
  }): ActivityInfoRegistrationInput {
    const recordId = record[ACTIVITY_INFO_RECORD_ID_ALIAS];
    if (typeof recordId !== 'string' || recordId === '') {
      throw new Error(
        `ActivityInfo record is missing its '${ACTIVITY_INFO_RECORD_ID_ALIAS}' column, which is required to build a referenceId`,
      );
    }

    const registrationData: ActivityInfoRegistrationInput = {
      referenceId: recordId,
    };

    for (const [fieldId, fieldMapping] of fieldMappingsByFieldId) {
      const value = this.mapRecordValue({
        rawValue: record[fieldId],
        choices: fieldMapping.choices,
      });

      if (value !== undefined) {
        registrationData[fieldMapping.attributeName] = value;
      }
    }

    return registrationData;
  }

  private static mapRecordValue({
    rawValue,
    choices,
  }: {
    rawValue: string | number | boolean | null | undefined;
    choices: ActivityInfoChoiceCleaned[];
  }): string | number | boolean | undefined {
    // A missing or empty value is left out entirely so it does not overwrite an
    // attribute with an empty string during import.
    if (rawValue === null || rawValue === undefined || rawValue === '') {
      return;
    }

    if (choices.length === 0) {
      return rawValue;
    }

    return this.normalizeChoiceValue({ rawValue, choices });
  }

  /**
   * The ActivityInfo query API returns a selected value as the choice's label.
   * It is translated here to the option value stored on the 121 registration
   * attribute, which is what the input validator checks a dropdown against.
   */
  private static normalizeChoiceValue({
    rawValue,
    choices,
  }: {
    rawValue: string | number | boolean;
    choices: ActivityInfoChoiceCleaned[];
  }): string | number | boolean {
    if (typeof rawValue !== 'string') {
      return rawValue;
    }

    const matchingChoice = choices.find(
      (choice) => choice.label === rawValue,
    );

    if (!matchingChoice) {
      return rawValue;
    }

    return getOptionValueForChoice({ choice: matchingChoice });
  }
}

/**
 * The value stored on a 121 registration attribute for an ActivityInfo choice.
 * The code is preferred because form authors use it as the machine-readable
 * value, falling back to the label which is what most forms actually set.
 */
export const getOptionValueForChoice = ({
  choice,
}: {
  choice: ActivityInfoChoiceCleaned;
}): string => choice.code ?? choice.label;
