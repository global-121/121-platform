/**
 * A single selectable value of an ActivityInfo 'enumerated' field.
 */
export interface ActivityInfoEnumItemDto {
  /** Immutable identifier of the choice, unique within the field */
  id: string;
  /** Human-readable choice text */
  label: string;
  /** Optional developer-friendly identifier */
  code?: string;
}
