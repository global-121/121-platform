import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';
import { QuestionOption } from '@121-service/src/shared/enum/question.enums';
import { RegistrationPreferredLanguageTranslation } from '@121-service/src/shared/types/registration-preferred-language-translation.type';
import { UILanguageTranslation } from '@121-service/src/shared/types/ui-language-translation.type';
import { WrapperType } from '@121-service/src/wrapper.type';

export interface ProgramRegistrationAttribute {
  duplicateCheck?: boolean;
  editableInPortal?: boolean;
  includeInTransactionExport?: boolean;
  isRequired?: boolean;
  koboLabel?: RegistrationPreferredLanguageTranslation | null;
  label?: RegistrationPreferredLanguageTranslation | null;
  name: string;
  options?: QuestionOption[];
  pattern?: string;
  placeholder?: UILanguageTranslation;
  scoring?: Record<string, unknown>;
  showInPeopleAffectedTable?: boolean;
  type: WrapperType<RegistrationAttributeTypes>;
}
