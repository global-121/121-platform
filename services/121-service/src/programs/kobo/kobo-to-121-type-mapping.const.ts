/**
 * Maps Kobo field types to 121 platform field types
 */
type TypeMapping = Record<string, string>;

/**
 * Mapping from Kobo field types to 121 platform field types
 */
export const KOBO_TO_121_TYPE_MAPPING: TypeMapping = {
  integer: 'numeric',
  decimal: 'numeric',
  range: 'numeric',
  text: 'text',
  select_one: 'dropdown',
  select_multiple: 'text',
  select_one_from_file: 'dropdown',
  select_multiple_from_file: 'text',
  rank: 'text',
  geopoint: 'text',
  geotrace: 'text',
  geoshape: 'text',
  date: 'text',
  time: 'text',
  dateTime: 'text',
  image: 'text',
  audio: 'text',
  'background-audio': 'text',
  video: 'text',
  file: 'text',
  barcode: 'text',
  calculate: 'text',
  acknowledge: 'text',
  hidden: 'text',
  'xml-external': 'text',
};

/**
 * Get the corresponding 121 platform type for a given Kobo type
 *
 * @param koboType - The Kobo field type
 * @returns The corresponding 121 platform type
 */
export function get121TypeFromKoboType(koboType: string): string {
  return KOBO_TO_121_TYPE_MAPPING[koboType] || 'text'; // Default to 'text' if no mapping exists
}
