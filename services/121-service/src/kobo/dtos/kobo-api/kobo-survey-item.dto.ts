/**
 * Represents a single question/field in a Kobo form survey.
 */
export interface KoboSurveyItemDto {
  /** Question identifier used in data collection */
  name?: string;
  /** Question type (e.g., 'text', 'integer', 'select_one', 'select_multiple') */
  type: string;
  /** Kobo's unique identifier for this question */
  $kuid: string;
  /** XPath reference used in form structure */
  $xpath: string;
  /** Auto-generated name by Kobo */
  $autoname: string;
  /** Question text in multiple languages (array index corresponds to language order) */
  label?: string[];
  /** Whether this question must be answered */
  required?: boolean;
  /** For 'select_one'/'select_multiple': references the choice list name */
  select_from_list_name?: string;
}
