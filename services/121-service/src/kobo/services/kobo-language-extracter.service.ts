import { Injectable } from '@nestjs/common';

import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

@Injectable()
export class KoboLanguageExtracterService {
  public getLanguageIsoCodes({
    koboLanguages,
  }: {
    koboLanguages: string[];
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

  private extractIsoCode({
    koboSurveyLanguage,
  }: {
    koboSurveyLanguage: string;
  }): RegistrationPreferredLanguage | undefined {
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
