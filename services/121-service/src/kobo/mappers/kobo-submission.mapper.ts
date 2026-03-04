import { KoboAttachmentDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-attachment.dto';
import { KoboSubmissionDto } from '@121-service/src/kobo/dtos/kobo-api/kobo-submission.dto';
import { KoboFormDefinitionMapper } from '@121-service/src/kobo/mappers/kobo-form-definition.mapper';
import { fspQuestionName } from '@121-service/src/kobo/services/kobo.service';
import { RegistrationViewEntity } from '@121-service/src/registration/entities/registration-view.entity';

export class KoboSubmissionMapper {
  public static mapSubmissionToRegistrationData({
    koboSubmission,
  }: {
    koboSubmission: KoboSubmissionDto;
  }): Record<string, string | boolean | number> {
    const registrationData: Record<string, string | boolean | number> = {};
    const attachments = koboSubmission._attachments ?? [];

    Object.entries(koboSubmission).forEach(([key, value]) => {
      const entry = this.mapSubmissionEntry({ key, value, attachments });
      if (entry) {
        registrationData[entry.attributeName] = entry.value;
      }
    });

    return registrationData;
  }

  private static mapSubmissionEntry({
    key,
    value,
    attachments,
  }: {
    key: string;
    value: unknown;
    attachments: KoboAttachmentDto[];
  }): { attributeName: string; value: string | boolean | number } | null {
    // Skip metadata fields
    if (!this.isMetadataField({ key })) {
      return null;
    }

    // Only process primitive values that can be stored as registration attributes
    if (!this.isSupportedValue(value)) {
      // We throw an error here because we do not expect this to happen
      throw new Error(
        `Unsupported Kobo submission value type for key "${key}". Only string, number, and boolean values are supported.`,
      );
    }

    const attributeName = this.mapSubmissionKeyToAttributeName({ key });

    // If the value is a filename path matching a known attachment, resolve it
    // to the attachment's download URL so the link is stored in 121 instead of
    // the raw filename.
    const attachmentUrl = this.resolveAttachmentUrl({ value, attachments });
    if (attachmentUrl !== null) {
      return { attributeName, value: attachmentUrl };
    }

    return { attributeName, value };
  }

  private static resolveAttachmentUrl({
    value,
    attachments,
  }: {
    value: unknown;
    attachments: KoboAttachmentDto[];
  }): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const expectedFilename = this.extractNormalizedFilename(value);
    if (!expectedFilename) {
      return null;
    }

    const matchingAttachment = attachments.find(
      (attachment) =>
        this.extractNormalizedFilename(attachment.filename) ===
        expectedFilename,
    );
    return matchingAttachment?.download_url ?? null;
  }

  private static extractNormalizedFilename(path: string): string | null {
    // Normalize filename by replacing spaces with underscores and removing special characters
    const normalized = path.replace(/ /g, '_').replace(/[(,)']/g, '');
    return normalized.split('/').pop() ?? null;
  }

  private static isSupportedValue(
    value: unknown,
  ): value is string | boolean | number {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    );
  }

  private static isMetadataField({ key }: { key: string }): boolean {
    /**
     * Metadata fields that should be excluded during mapping to registration data.
     * These are Kobo system fields, not survey question answers.
     * Note: '_uuid' is NOT in this list because it needs to be mapped to 'referenceId'
     */
    const koboMetadataKeys = [
      '_id',
      'formhub/uuid',
      'start',
      'end',
      '__version__',
      'meta/instanceID',
      '_xform_id_string',
      '_attachments',
      '_status',
      '_geolocation',
      '_submission_time',
      '_tags',
      '_notes',
      '_validation_status',
      '_submitted_by',
    ];
    return !koboMetadataKeys.includes(key);
  }

  private static mapSubmissionKeyToAttributeName({
    key,
  }: {
    key: string;
  }): string {
    const attributeName =
      KoboFormDefinitionMapper.parseAttributeNameFromKoboSurveyItemName({
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
