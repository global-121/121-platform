import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { ActivityInfoMockFormIds } from '@mock-service/src/activityinfo/activityinfo-mock-form-ids';

interface MockEnumItem {
  id: string;
  label: string;
  code?: string;
}

interface MockFormField {
  id: string;
  code?: string;
  label: string;
  type: string;
  required: boolean;
  typeParameters?: {
    cardinality?: string;
    presentation?: string;
    values?: MockEnumItem[];
  };
}

export interface MockFormSchema {
  id: string;
  label: string;
  schemaVersion: number;
  databaseId: string;
  language?: string;
  elements: MockFormField[];
}

// Field ids are stable so a test can assert on the mapping 121 stores.
const FIELD_IDS = {
  fsp: 'cmockfspfield0001',
  phoneNumber: 'cmockphonefield01',
  fullName: 'cmocknamefield001',
  whatsappPhoneNumber: 'cmockwhatsappfld1',
  nationalId: 'cmocknationalid01',
  householdSize: 'cmockhouseholdsz1',
  district: 'cmockdistrictfld1',
  uncodedField: 'cmockuncodedfld01',
  children: 'cmockchildrenfld1',
  scope: 'cmockscopefield01',
  addressStreet: 'cmockaddrstreet01',
  addressHouseNumber: 'cmockaddrhouseno1',
  addressHouseNumberAddition: 'cmockaddrhouseadd',
  addressPostalCode: 'cmockaddrpostal01',
  addressCity: 'cmockaddrcity0001',
} as const;

const fspField: MockFormField = {
  id: FIELD_IDS.fsp,
  code: 'fsp',
  label: 'Financial Service Provider',
  type: 'enumerated',
  required: true,
  typeParameters: {
    cardinality: 'single',
    presentation: 'dropdown',
    values: [
      { id: 'cmockfspchoice01', label: 'Intersolve-voucher-whatsapp' },
      { id: 'cmockfspchoice02', label: 'Intersolve-visa' },
    ],
  },
};

const requiredTextField = ({
  id,
  code,
  label,
}: {
  id: string;
  code: string;
  label: string;
}): MockFormField => ({
  id,
  code,
  label,
  type: 'FREE_TEXT',
  required: true,
});

const baseFields: MockFormField[] = [
  fspField,
  requiredTextField({
    id: FIELD_IDS.phoneNumber,
    code: 'phoneNumber',
    label: 'Phone number',
  }),
  requiredTextField({
    id: FIELD_IDS.fullName,
    code: 'fullName',
    label: 'Full name',
  }),
  requiredTextField({
    id: FIELD_IDS.whatsappPhoneNumber,
    code: 'whatsappPhoneNumber',
    label: 'WhatsApp phone number',
  }),
  requiredTextField({
    id: FIELD_IDS.nationalId,
    code: 'nationalId',
    label: 'National ID number',
  }),
  requiredTextField({
    id: FIELD_IDS.scope,
    code: 'scope',
    label: 'Scope',
  }),
  requiredTextField({
    id: FIELD_IDS.addressStreet,
    code: 'addressStreet',
    label: 'Street',
  }),
  {
    id: FIELD_IDS.addressHouseNumber,
    code: 'addressHouseNumber',
    label: 'House number',
    type: 'quantity',
    required: true,
  },
  requiredTextField({
    id: FIELD_IDS.addressHouseNumberAddition,
    code: 'addressHouseNumberAddition',
    label: 'House number addition',
  }),
  requiredTextField({
    id: FIELD_IDS.addressPostalCode,
    code: 'addressPostalCode',
    label: 'Postal code',
  }),
  requiredTextField({
    id: FIELD_IDS.addressCity,
    code: 'addressCity',
    label: 'City',
  }),
  {
    id: FIELD_IDS.householdSize,
    code: 'householdSize',
    label: 'How many people live in this household?',
    type: 'quantity',
    required: false,
  },
  {
    id: FIELD_IDS.district,
    code: 'district',
    label: 'District',
    type: 'enumerated',
    required: false,
    typeParameters: {
      cardinality: 'single',
      presentation: 'dropdown',
      values: [
        { id: 'cmockdistrict001', label: 'North', code: 'north' },
        { id: 'cmockdistrict002', label: 'South', code: 'south' },
      ],
    },
  },
];

const mockRecordValuesByFieldId: Record<string, string | number>[] = [
  {
    [FIELD_IDS.fsp]: 'Intersolve-voucher-whatsapp',
    [FIELD_IDS.phoneNumber]: '14155238886',
    [FIELD_IDS.fullName]: 'Gemma Houtenbos',
    [FIELD_IDS.whatsappPhoneNumber]: '14155238886',
    [FIELD_IDS.nationalId]: '32121321',
    [FIELD_IDS.householdSize]: 4,
    [FIELD_IDS.district]: 'North',
    [FIELD_IDS.scope]: 'utrecht',
    [FIELD_IDS.addressStreet]: 'Mock street',
    [FIELD_IDS.addressHouseNumber]: 1,
    [FIELD_IDS.addressHouseNumberAddition]: 'A',
    [FIELD_IDS.addressPostalCode]: '1234AB',
    [FIELD_IDS.addressCity]: 'Utrecht',
  },
  {
    [FIELD_IDS.fsp]: 'Intersolve-visa',
    [FIELD_IDS.phoneNumber]: '14155238887',
    [FIELD_IDS.fullName]: 'Jan Janssen',
    [FIELD_IDS.whatsappPhoneNumber]: '14155238887',
    [FIELD_IDS.nationalId]: '32121322',
    [FIELD_IDS.householdSize]: 2,
    [FIELD_IDS.district]: 'South',
    [FIELD_IDS.scope]: 'utrecht',
    [FIELD_IDS.addressStreet]: 'Mock avenue',
    [FIELD_IDS.addressHouseNumber]: 2,
    [FIELD_IDS.addressHouseNumberAddition]: '',
    [FIELD_IDS.addressPostalCode]: '5678CD',
    [FIELD_IDS.addressCity]: 'Utrecht',
  },
];

const MOCK_RECORD_IDS = ['cmockrecord000001', 'cmockrecord000002'];

@Injectable()
export class ActivityInfoMockService {
  public getFormSchema(formId: string): MockFormSchema {
    const formSchema = this.buildFormSchemas()[formId];

    if (!formSchema) {
      throw new HttpException(
        { code: 'NOT_FOUND', message: `Form ${formId} does not exist` },
        HttpStatus.NOT_FOUND,
      );
    }

    return formSchema;
  }

  /**
   * Mirrors the ActivityInfo query API: every query parameter defines an output
   * column, where the parameter name is the alias and its value the formula.
   * 121 asks for each field by its immutable id, so the mock resolves formulas
   * as field ids.
   */
  public getRecords({
    formId,
    columnAliasesToFormulas,
  }: {
    formId: string;
    columnAliasesToFormulas: Record<string, string>;
  }): Record<string, string | number | null>[] {
    // Throws when the form does not exist, matching the real API.
    this.getFormSchema(formId);

    if (formId === ActivityInfoMockFormIds.withoutRecords) {
      return [];
    }

    return mockRecordValuesByFieldId.map((recordValues, index) => {
      const row: Record<string, string | number | null> = {};

      for (const [alias, formula] of Object.entries(
        columnAliasesToFormulas,
      )) {
        row[alias] =
          formula === '_id'
            ? MOCK_RECORD_IDS[index]
            : (recordValues[formula] ?? null);
      }

      return row;
    });
  }

  private buildFormSchemas(): Record<string, MockFormSchema> {
    return {
      [ActivityInfoMockFormIds.valid]: {
        id: ActivityInfoMockFormIds.valid,
        label: 'Mock registration form',
        schemaVersion: 1,
        databaseId: 'cmockdatabase0001',
        language: 'en',
        elements: baseFields,
      },
      [ActivityInfoMockFormIds.withoutRecords]: {
        id: ActivityInfoMockFormIds.withoutRecords,
        label: 'Mock registration form without records',
        schemaVersion: 1,
        databaseId: 'cmockdatabase0001',
        language: 'en',
        elements: baseFields,
      },
      [ActivityInfoMockFormIds.fieldWithoutCode]: {
        id: ActivityInfoMockFormIds.fieldWithoutCode,
        label: 'Mock form with an uncoded field',
        schemaVersion: 1,
        databaseId: 'cmockdatabase0001',
        language: 'en',
        elements: [
          ...baseFields,
          {
            id: FIELD_IDS.uncodedField,
            label: 'A field without a code',
            type: 'FREE_TEXT',
            required: false,
          },
        ],
      },
      [ActivityInfoMockFormIds.nonEnglishLanguage]: {
        id: ActivityInfoMockFormIds.nonEnglishLanguage,
        label: 'Mock form in French',
        schemaVersion: 1,
        databaseId: 'cmockdatabase0001',
        language: 'fr',
        elements: baseFields,
      },
      [ActivityInfoMockFormIds.withSubForm]: {
        id: ActivityInfoMockFormIds.withSubForm,
        label: 'Mock form with a subform',
        schemaVersion: 1,
        databaseId: 'cmockdatabase0001',
        language: 'en',
        elements: [
          ...baseFields,
          {
            id: FIELD_IDS.children,
            code: 'children',
            label: 'Children',
            type: 'subform',
            required: false,
          },
        ],
      },
    };
  }
}
