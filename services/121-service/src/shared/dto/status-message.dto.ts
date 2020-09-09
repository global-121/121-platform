import { StatusEnum } from '../enum/status.enum';

export class StatusMessageDto {
  public readonly status: StatusEnum;
  public readonly message: any;
}
