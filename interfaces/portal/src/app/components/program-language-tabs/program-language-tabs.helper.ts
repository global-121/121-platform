import { FormControl, FormGroup } from '@angular/forms';

import { RegistrationPreferredLanguage } from '@121-service/src/shared/enum/registration-preferred-language.enum';

import { Program } from '~/domains/program/program.model';

export const getTranslatableFormGroup = ({
  program,
  getInitialValue,
}: {
  program: Program;
  getInitialValue: (
    language: RegistrationPreferredLanguage,
  ) => string | undefined;
}) => {
  const languages = program.languages;
  return new FormGroup(
    Object.fromEntries(
      languages.map((language) => [
        language,
        new FormControl(getInitialValue(language), {
          nonNullable: true,
        }),
      ]),
    ),
  );
};
