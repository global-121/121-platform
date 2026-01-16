export interface KoboSurveyItemDto {
  name?: string;
  type: string;
  $kuid: string;
  $xpath: string;
  $autoname: string;
  label?: string[];
  required?: boolean;
  select_from_list_name?: string;
}
