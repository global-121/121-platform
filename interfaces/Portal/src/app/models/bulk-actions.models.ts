import { RegistrationStatusEnum } from '../../../../../services/121-service/src/registration/enum/registration-status.enum';
import Permission from '../auth/permission.enum';
import { InputProps } from '../shared/confirm-prompt/confirm-prompt.component';
import { ProgramPhase } from './program.model';

export enum BulkActionId {
  chooseAction = '',
  invite = 'invite',
  include = 'include',
  endInclusion = 'endInclusion',
  reject = 'reject',
  markNoLongerEligible = 'markNoLongerEligible',
  sendMessage = 'sendMessage',
  deletePa = 'deletePa',
  divider = 'divider',
  doPayment = 'doPayment',
  pause = 'pause',
  markAsValidated = 'markAsValidated',
  markAsDeclined = 'markAsDeclined',
}

export const BulkActionRegistrationStatusMap = {
  [BulkActionId.invite]: RegistrationStatusEnum.invited,
  [BulkActionId.include]: RegistrationStatusEnum.included,
  [BulkActionId.endInclusion]: RegistrationStatusEnum.inclusionEnded,
  [BulkActionId.reject]: RegistrationStatusEnum.rejected,
  [BulkActionId.pause]: RegistrationStatusEnum.paused,
};

export class BulkAction {
  id: BulkActionId;
  enabled: boolean;
  label: string;
  permissions: Permission[];
  phases: ProgramPhase[];
  showIfNoValidation: boolean;
  confirmConditions?: InputProps;
  data?: {
    [_key: string]: string | number;
  };
}

export class BulkActionResult {
  public readonly totalFilterCount: number;
  public readonly applicableCount: number;
  public readonly nonApplicableCount: number;
  public readonly sumPaymentAmountMultiplier?: number;
  public readonly fspsInPayment?: string[];
}
