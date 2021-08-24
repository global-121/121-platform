import { RegistrationStatusEnum } from '../../registration/enum/registration-status.enum';

export interface PaMetrics {
  [RegistrationStatusEnum.imported]?: number;
  [RegistrationStatusEnum.invited]?: number;
  [RegistrationStatusEnum.noLongerEligible]?: number;
  [RegistrationStatusEnum.startedRegistation]: number;
  [RegistrationStatusEnum.registered]: number;
  [RegistrationStatusEnum.registeredWhileNoLongerEligible]?: number;
  [RegistrationStatusEnum.selectedForValidation]?: number;
  [RegistrationStatusEnum.validated]: number;
  [RegistrationStatusEnum.included]: number;
  [RegistrationStatusEnum.inclusionEnded]: number;
  [RegistrationStatusEnum.rejected]: number;
}
