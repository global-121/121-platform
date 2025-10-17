import { FormControl, FormGroup } from '@angular/forms';

import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';

import { Project } from '~/domains/project/project.model';

export const getTranslatableFormGroup = ({
  project,
  getInitialValue,
}: {
  project: Project;
  getInitialValue: (language: LanguageEnum) => string;
}) => {
  const languages = project.languages;

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
