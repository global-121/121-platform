/**
 * Represents a Kobo submission response.
 * Kobo submissions contain both fixed metadata fields and dynamic form fields
 * based on the survey questions defined in the Kobo form.
 */
export interface KoboSubmissionDto extends Record<string, unknown> {
  // Metadata fields (excluded during mapping to registration data)
  _id: number;
  _xform_id_string: string;
  _submission_time: string;
  _status: string;
  __version__: string;
  'formhub/uuid'?: string;
  start?: string;
  end?: string;
  'meta/instanceID'?: string;
  _attachments?: unknown[];
  _geolocation?: string[];
  _tags?: string[];
  _notes?: string[];
  _validation_status?: string;
  _submitted_by?: string;

  // Special field used in mapping
  _uuid: string; // Maps to referenceId

  // Dynamic form fields are allowed through the Record<string, unknown> extension
  // Examples: fsp, fullName, phoneNumber, nationalId, etc.
}
