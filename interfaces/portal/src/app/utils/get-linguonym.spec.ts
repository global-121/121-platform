import { UILanguage } from '@121-platform/shared';

import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

import { getLinguonym } from '~/utils/get-linguonym';

describe('getLinguonym', () => {
  it('should return correct linguonym for valid language codes', () => {
    const result = getLinguonym({
      languageToDisplayNameOf: RegistrationPreferredLanguage.en,
      languageToShowNameIn: UILanguage.fr,
    });
    expect(result).toBe('anglais');
  });

  // TODO: The test for an invalid language code weirdly enough produces a different
  // result here than in the browser. Investigate this later.
});
