/**
 * Interface representing a Kobo survey item
 */
export interface KoboSurveyItem {
  name?: string;
  type: string;
  $kuid: string;
  $xpath: string;
  $autoname: string;
  label?: string[]; // For translations
  required?: boolean;
  select_from_list_name?: string; // For select_one and select_multiple types
  calculation?: string;
  default?: string;
  appearance?: string;
  constraint_message?: string;
  _isRepeat?: string;
  // Add other properties as needed
}
