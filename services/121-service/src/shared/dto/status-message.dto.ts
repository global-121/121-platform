import { StatusEnum } from '../enum/status.enum';

export class StatusMessageDto {
  public readonly status: StatusEnum;
  public readonly message?: any;
  public readonly nrSuccessfull?: number;
  public readonly nrFailed?: number;
}
