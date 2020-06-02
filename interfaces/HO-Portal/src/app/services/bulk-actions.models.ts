import { UserRole } from '../auth/user-role.enum';
import { ProgramPhase } from '../models/program.model';

export enum BulkActionId {
  chooseAction = 'choose-action',
  selectForValidation = 'select-for-validation',
}

export class BulkAction {
  id: BulkActionId;
  enabled: boolean;
  label: string;
  roles: UserRole[];
  phases: ProgramPhase[];
}
