/**
 * Form ids served by the ActivityInfo mock service. Each one exercises a
 * different validation outcome in the 121-service.
 */
export const ActivityInfoMockFormIds = {
  valid: 'cmockvalidform001',
  fieldWithoutCode: 'cmockmissingcode1',
  nonEnglishLanguage: 'cmocknonenglish01',
  withSubForm: 'cmocksubform00001',
  withoutRecords: 'cmocknorecords001',
} as const;

export type ActivityInfoMockFormId =
  (typeof ActivityInfoMockFormIds)[keyof typeof ActivityInfoMockFormIds];
