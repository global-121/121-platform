// This is a non exhaustive list of properties for the Kobo Entity, these only cover what is needed at the moment.

export interface KoboChoiceDto {
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
   * Auto-generated value
   */
  $autovalue: string;
}
