import Permission from '../auth/permission.enum';
import { InputProps } from '../shared/input-prompt/input-prompt.component';
import { ProgramPhase } from './program.model';

export enum BulkActionId {
  chooseAction = '',
  invite = 'invite',
  selectForValidation = 'select-for-validation',
  include = 'include',
  endInclusion = 'end-inclusion',
  reject = 'reject',
  markNoLongerEligible = 'mark-no-longer-eligible',
  sendMessage = 'send-message',
  deletePa = 'delete-pa',
  divider = 'divider',
  doPayment = 'do-payment',
  pause = 'pause',
}

export class BulkAction {
  id: BulkActionId;
  enabled: boolean;
  label: string;
  permissions: Permission[];
  phases: ProgramPhase[];
  showIfNoValidation: boolean;
  confirmConditions?: InputProps;
}

export class BulkActionResult {
  public readonly totalFilterCount: number;
  public readonly applicableCount: number;
  public readonly nonApplicableCount: number;
}
