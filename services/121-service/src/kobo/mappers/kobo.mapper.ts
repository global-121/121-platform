import { KOBO_METADATA_KEYS } from '@121-service/src/kobo/consts/kobo-metadata-keys.const';
import { KoboAssetDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-asset.dto';
import { KoboChoiceDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-choice.dto';
import { KoboSubmissionDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-submission.dto';
import { KoboSurveyItemDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-survey-item.dto';
import { KoboResponseDto } from '@121-service/src/kobo/dtos/kobo-response.dto';
import { KoboEntity } from '@121-service/src/kobo/entities/kobo.entity';
import { KoboChoiceCleaned } from '@121-service/src/kobo/interfaces/kobo-choice-cleaned.interface';
import { KoboFormDefinition } from '@121-service/src/kobo/interfaces/kobo-form-definition.interface';
import { KoboSurveyItemCleaned } from '@121-service/src/kobo/interfaces/kobo-survey-item-cleaned.interface';
import { fspQuestionName } from '@121-service/src/kobo/services/kobo.service';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';

export class KoboMapper {
  public static mapEntityToDto(entity: KoboEntity): KoboResponseDto {
    const dto: KoboResponseDto = {
      assetUid: entity.assetUid,
      versionId: entity.versionId,
      dateDeployed: entity.dateDeployed,
      url: entity.url,
      programId: entity.programId,
      name: entity.name,
    };
    return dto;
  }

  public static mapEntitiesToDtos(entities: KoboEntity[]): KoboResponseDto[] {
    return entities.map(KoboMapper.mapEntityToDto);
  }

  public static formDefinitionToEntity({
    formDefinition,
    programId,
    assetUid,
    token,
    url,
    name,
  }: {
    formDefinition: KoboFormDefinition;
    programId: number;
    assetUid: string;
    token: string;
    url: string;
    name: string | null;
  }): Omit<KoboEntity, 'id' | 'created' | 'updated' | 'program'> {
    return {
      programId,
      assetUid,
      token,
      url,
      dateDeployed: formDefinition.dateDeployed,
      versionId: formDefinition.versionId,
      name,
    };
  }

  public static koboAssetDtoToKoboFormDefinition({
    asset,
  }: {
    asset: KoboAssetDto;
  }): KoboFormDefinition {
    const cleanedChoices = this.choicesDtosToChoicesCleaned({
      koboChoices: asset.content.choices || [],
    });

    return {
      name: asset.name ?? '',
      survey: this.surveyItemsDtosToSurveyItemsCleaned({
        koboSurveyItems: asset.content.survey || [],
        cleanedChoices,
      }),
      languages: asset.summary.languages || [],
      dateDeployed: asset.date_deployed,
      versionId: asset.version_id,
    };
  }

  private static surveyItemsDtosToSurveyItemsCleaned({
    koboSurveyItems,
    cleanedChoices,
  }: {
    koboSurveyItems: KoboSurveyItemDto[];
    cleanedChoices: KoboChoiceCleaned[];
  }): KoboSurveyItemCleaned[] {
    return koboSurveyItems.map((item) => {
      const parsedName = this.parseAttributeNameFromKoboSurveyItem({ item });
      const itemChoices = item.select_from_list_name
        ? cleanedChoices.filter(
            (choice) => choice.list_name === item.select_from_list_name,
          )
        : [];

      // This removes unnecessary properties from the KoboSurveyItems
      return {
        name: parsedName,
        type: item.type.split(' ')[0], // Normalize e.g. 'select_one list_name' to 'select_one'
        label: item.label,
        required: item.required,
        choices: itemChoices,
      };
    });
  }

  private static parseAttributeNameFromKoboSurveyItem({
    item,
  }: {
    item: KoboSurveyItemDto;
  }): string {
    const name = this.getNameSurveyItem({ koboSurveyItem: item });

    return this.parseAttributeNameFromKoboSurveyItemName({
      name,
    });
  }

  private static parseAttributeNameFromKoboSurveyItemName({
    name,
  }: {
    name: string;
  }): string {
    if (!name.includes('/')) {
      return name;
    }

    const parts = name.split('/');
    return parts[parts.length - 1];
  }

  private static choicesDtosToChoicesCleaned({
    koboChoices,
  }: {
    koboChoices: KoboChoiceDto[];
  }): KoboChoiceCleaned[] {
    return koboChoices.map((choice) => {
      const parsedName = this.getNameChoiceItem({ koboChoice: choice });
      return {
        name: parsedName,
        label: choice.label,
        list_name: choice.list_name,
      };
    });
  }

  private static getNameSurveyItem({
    koboSurveyItem: koboSurveyItem,
  }: {
    koboSurveyItem: KoboSurveyItemDto;
  }): string {
    return (
      koboSurveyItem.name || koboSurveyItem.$autoname || koboSurveyItem.$kuid
    );
  }

  private static getNameChoiceItem({
    koboChoice,
  }: {
    koboChoice: KoboChoiceDto;
  }): string {
    return koboChoice.name || koboChoice.$autovalue || koboChoice.$kuid;
  }

  // ============================================================================
  // Submission Data Mapping
  // ============================================================================

  public static mapSubmissionToRegistrationData({
    koboSubmission,
  }: {
    koboSubmission: KoboSubmissionDto;
  }): Record<string, string | boolean | number> {
    const registrationData: Record<string, string | boolean | number> = {};

    Object.entries(koboSubmission).forEach(([key, value]) => {
      const entry = this.mapSubmissionEntry({ key, value });
      if (entry) {
        registrationData[entry.attributeName] = entry.value;
      }
    });

    return registrationData;
  }

  private static mapSubmissionEntry({
    key,
    value,
  }: {
    key: string;
    value: unknown;
  }): { attributeName: string; value: string | boolean | number } | null {
    // Skip metadata fields
    if (!this.shouldIncludeSubmissionKey({ key })) {
      return null;
    }

    // Only process primitive values that can be stored as registration attributes
    if (!this.isPrimitiveValue(value)) {
      // We throw an error here because we do not expect this to happen
      throw new Error(
        `Unsupported Kobo submission value type for key "${key}". Only string, number, and boolean values are allowed.`,
      );
    }

    const attributeName = this.mapSubmissionKeyToAttributeName({ key });
    return { attributeName, value };
  }

  private static isPrimitiveValue(
    value: unknown,
  ): value is string | boolean | number {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    );
  }

  private static shouldIncludeSubmissionKey({ key }: { key: string }): boolean {
    return !KOBO_METADATA_KEYS.includes(key as any);
  }

  private static mapSubmissionKeyToAttributeName({
    key,
  }: {
    key: string;
  }): string {
    const attributeName = this.parseAttributeNameFromKoboSurveyItemName({
      name: key,
    });

    // Maps specific Kobo question names to RegistrationViewEntity properties
    // - '_uuid' is Kobo's submission identifier that becomes the registration 'referenceId'
    // - 'fsp' is a special Kobo question that specifies which FSP configuration to use
    const koboToRegistrationKeyMapping: Record<
      string,
      keyof RegistrationViewEntity
    > = {
      _uuid: 'referenceId',
      [fspQuestionName]: 'programFspConfigurationName',
    };

    // Check if this is a known mapping that must be a RegistrationViewEntity key
    if (attributeName in koboToRegistrationKeyMapping) {
      return koboToRegistrationKeyMapping[attributeName];
    }

    return attributeName;
  }
}
