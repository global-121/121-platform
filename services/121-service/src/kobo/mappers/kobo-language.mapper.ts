import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

export class KoboLanguageMapper {
  public static getLanguageIsoCodes({
    koboLanguages,
  }: {
    koboLanguages: (string | undefined)[];
  }): RegistrationPreferredLanguage[] {
    const isoCodes: RegistrationPreferredLanguage[] = [];
    for (const language of koboLanguages) {
      const isoCode = this.extractIsoCode({ koboSurveyLanguage: language });
      if (isoCode) {
        isoCodes.push(isoCode);
      }
    }
    return isoCodes;
  }

  public static extractIsoCode({
    koboSurveyLanguage,
  }: {
    koboSurveyLanguage: string | undefined;
  }): RegistrationPreferredLanguage | undefined {
    if (!koboSurveyLanguage) {
      return undefined;
    }
    for (const isoLanguageCode of Object.values(
      RegistrationPreferredLanguage,
    )) {
      if (koboSurveyLanguage.includes(`(${isoLanguageCode})`)) {
        return isoLanguageCode;
      }
    }
    return undefined;
  }
}
