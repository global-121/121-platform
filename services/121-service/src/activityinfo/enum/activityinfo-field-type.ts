/**
 * Field type identifiers as serialized by the ActivityInfo getFormSchema API.
 * The casing is inconsistent in ActivityInfo itself, so these values are copied
 * verbatim from the type registry rather than normalized.
 * See: https://www.activityinfo.org/support/docs/api/reference/getFormSchema.html
 */
export enum ActivityInfoFieldType {
  attachment = 'attachment',
  calculated = 'calculated',
  date = 'date',
  enumerated = 'enumerated',
  epiWeek = 'epiweek',
  fortnight = 'fortnight',
  freeText = 'FREE_TEXT',
  geoPoint = 'geopoint',
  month = 'month',
  multipleSelectReference = 'multiselectreference',
  narrative = 'NARRATIVE',
  note = 'note',
  quantity = 'quantity',
  reference = 'reference',
  reverseReference = 'reversereference',
  section = 'section',
  serial = 'serial',
  subForm = 'subform',
}

export enum ActivityInfoEnumeratedCardinality {
  single = 'single',
  multiple = 'multiple',
}
