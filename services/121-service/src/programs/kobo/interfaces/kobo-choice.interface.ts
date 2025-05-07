/**
 * Interface representing a choice option in a Kobo form
 */
export interface KoboChoice {
  /**
   * Internal name/identifier for the choice
   */
  name: string;

  /**
   * Unique identifier string assigned by Kobo
   */
  $kuid: string;

  /**
   * Array of translations for the label (typically [english, otherLanguage])
   */
  label: string[];

  /**
   * Name of the list this choice belongs to
   * Used to group choices for select questions
   */
  list_name: string;

  /**
   * Auto-generated value, often matching the name
   */
  $autovalue: string;
}
