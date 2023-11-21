import Permission from '../auth/permission.enum';
import { InputProps } from '../shared/input-prompt/input-prompt.component';
import { ProgramPhase } from './program.model';

export enum BulkActionId {
  chooseAction = '',
  invite = 'invite',
  selectForValidation = 'selectForValidation',
  include = 'include',
  endInclusion = 'endInclusion',
  reject = 'reject',
  markNoLongerEligible = 'markNoLongerEligible',
  sendMessage = 'sendMessage',
  deletePa = 'deletePa',
  divider = 'divider',
  doPayment = 'doPayment',
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
  public readonly sumPaymentAmountMultiplier?: number;
}
