import { UserRole } from '../auth/user-role.enum';
import { InputProps } from '../shared/input-prompt/input-prompt.component';
import { ProgramPhase } from './program.model';

export enum BulkActionId {
  chooseAction = 'choose-action',
  selectForValidation = 'select-for-validation',
  includeProjectOfficer = 'include-project-officer',
  includeProgramManager = 'include-program-manager',
  reject = 'reject',
  notifyIncluded = 'notify-included',
}

export class BulkAction {
  id: BulkActionId;
  enabled: boolean;
  label: string;
  roles: UserRole[];
  phases: ProgramPhase[];
  showIfNoValidation: boolean;
  confirmConditions?: InputProps;
}
