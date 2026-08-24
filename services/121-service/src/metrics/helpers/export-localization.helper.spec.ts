import {
  buildExportColumnHeaders,
  localizeExportData,
} from '@121-service/src/metrics/helpers/export-localization.helper';
import { RegistrationPreferredLanguageTranslation } from '@121-service/src/shared/types/registration-preferred-language-translation.type';

describe('buildExportColumnHeaders', () => {
  it('should return an empty mapping when no custom attribute labels are provided', () => {
    expect(buildExportColumnHeaders({})).toEqual({});
    expect(buildExportColumnHeaders({ language: 'nl' })).toEqual({});
  });

  it('should map columns to the requested language label', () => {
    const customAttributeLabels: Record<
      string,
      RegistrationPreferredLanguageTranslation
    > = {
      namePartnerOrganization: { en: 'Partner', nl: 'Partnerorganisatie' },
    };

    expect(
      buildExportColumnHeaders({ customAttributeLabels, language: 'nl' }),
    ).toEqual({ namePartnerOrganization: 'Partnerorganisatie' });
  });

  it('should fall back to English when the requested language is not available', () => {
    const customAttributeLabels: Record<
      string,
      RegistrationPreferredLanguageTranslation
    > = {
      namePartnerOrganization: { en: 'Partner' },
    };

    expect(
      buildExportColumnHeaders({ customAttributeLabels, language: 'ar' }),
    ).toEqual({ namePartnerOrganization: 'Partner' });
  });

  it('should keep the column name when no translation exists at all', () => {
    const customAttributeLabels: Record<
      string,
      RegistrationPreferredLanguageTranslation
    > = {
      namePartnerOrganization: {},
    };

    expect(
      buildExportColumnHeaders({ customAttributeLabels, language: 'nl' }),
    ).toEqual({ namePartnerOrganization: 'namePartnerOrganization' });
  });
});

describe('localizeExportData', () => {
  it('should rename columns using the header mapping', () => {
    const data = [{ namePartnerOrganization: 'Red Cross', status: 'included' }];

    const result = localizeExportData(data, {
      namePartnerOrganization: 'Partnerorganisatie',
    });

    expect(result).toEqual([
      { Partnerorganisatie: 'Red Cross', status: 'included' },
    ]);
  });

  it('should keep unmapped columns as-is', () => {
    const data = [{ name: 'John Doe' }];

    expect(localizeExportData(data, {})).toEqual([{ name: 'John Doe' }]);
  });

  it('should not overwrite data when two columns map to the same header', () => {
    const data = [{ firstName: 'John', preferredName: 'Johnny' }];

    const result = localizeExportData(data, {
      firstName: 'Naam',
      preferredName: 'Naam',
    });

    expect(result).toEqual([{ Naam: 'John', preferredName: 'Johnny' }]);
  });

  it('should not overwrite data when a translated header collides with a system column name', () => {
    const data = [{ status: 'included', customField: 'value' }];

    const result = localizeExportData(data, { customField: 'status' });

    expect(result).toEqual([{ status: 'included', customField: 'value' }]);
  });

  it('should not overwrite a later unmapped column when a mapped header matches its key', () => {
    const data = [{ customA: 'valueA', customB: 'valueB' }];

    const result = localizeExportData(data, { customA: 'customB' });

    expect(result).toEqual([{ customA: 'valueA', customB: 'valueB' }]);
  });
});
