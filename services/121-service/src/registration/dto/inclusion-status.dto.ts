import { RegistrationStatusEnum } from '../enum/registration-status.enum';

export class InclusionStatus {
  public readonly status: RegistrationStatusEnum | 'unavailable';
}
