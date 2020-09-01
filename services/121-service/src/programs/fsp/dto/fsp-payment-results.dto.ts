import { StatusMessageDto } from './../../../shared/dto/status-message.dto';

export class FspPaymentResultDto {
  public paymentResult: StatusMessageDto;
  public readonly nrConnectionsFsp: number;
}
