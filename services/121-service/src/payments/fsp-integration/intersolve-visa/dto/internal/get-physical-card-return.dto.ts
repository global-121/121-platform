import { IntersolveVisaCardStatus } from '@121-service/src/payments/fsp-integration/intersolve-visa/enum/intersolve-visa-card-status.enum';

export class GetPhysicalCardReturnDto {
  public readonly status: IntersolveVisaCardStatus;
}
