import { UserRole } from '../auth/user-role.enum';
import { InputProps } from '../shared/input-prompt/input-prompt.component';
import { ProgramPhase } from './program.model';

export enum BulkActionId {
  chooseAction = '',
  selectForValidation = 'select-for-validation',
  includeRunProgramRole = 'include-run-program-role',
  includePersonalDataRole = 'include-personal-data-role',
  reject = 'reject',
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
