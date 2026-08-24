import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';
import { RegistrationPreferredLanguageTranslation } from '@121-service/src/shared/types/registration-preferred-language-translation.type';
import { resolveExportLanguage } from '@121-service/src/utils/language.helpers';

/**
 * Build column header mapping from custom attribute labels in the database.
 * Uses DB labels (from program_registration_attribute.label) for custom attributes.
 * System columns without DB labels keep their column name as-is.
 */
export function buildExportColumnHeaders({
  customAttributeLabels,
  language,
}: {
  customAttributeLabels?: Record<string, RegistrationPreferredLanguageTranslation>;
  language?: string;
}): Record<string, string> {
  const resolvedLanguage = resolveExportLanguage(language);
  const headerMapping: Record<string, string> = {};

  if (!customAttributeLabels) {
    return headerMapping;
  }

  for (const [columnName, translations] of Object.entries(customAttributeLabels)) {
    headerMapping[columnName] =
      translations[resolvedLanguage as RegistrationPreferredLanguage] ||
      translations[RegistrationPreferredLanguage.en] ||
      columnName;
  }

  return headerMapping;
}

/**
 * Apply localized column headers to export data before XLSX conversion
 */
export function localizeExportData(
  data: Record<string, unknown>[],
  headerMapping: Record<string, string>,
): Record<string, unknown>[] {
  return data.map((row) => {
    const originalKeys = new Set(Object.keys(row));
    const renamedRow: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      const mappedHeader = headerMapping[key];
      // Keep the original key when the mapped header would overwrite another column
      const header =
        mappedHeader !== undefined &&
        !originalKeys.has(mappedHeader) &&
        !(mappedHeader in renamedRow)
          ? mappedHeader
          : key;
      renamedRow[header] = value;
    }
    return renamedRow;
  });
}
