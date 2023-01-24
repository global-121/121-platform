import { RegistrationStatusEnum } from './../../registration/enum/registration-status.enum';
export class VoucherWithBalanceDto {
  public paNumber: number;
  public name?: string;
  public phoneNumber: string;
  public whatsappPhoneNumber: string;
  public paStatus: RegistrationStatusEnum;
  public partnerName: string;
  public payment: number;
  public issueDate: Date;
  public originalBalance: number;
  public remainingBalance: number;
  public updatedRemainingBalanceUTC: Date;
  public voucherSend: boolean;
}
