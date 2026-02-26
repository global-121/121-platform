/**
 * Metadata fields that should be excluded during mapping to registration data.
 * These are Kobo system fields, not survey question answers.
 * Note: '_uuid' is NOT in this list because it needs to be mapped to 'referenceId'
 */
export const KOBO_METADATA_KEYS = [
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
] as const;
