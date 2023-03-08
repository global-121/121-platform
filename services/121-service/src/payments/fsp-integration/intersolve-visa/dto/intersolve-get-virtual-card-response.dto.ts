import { IntersolveReponseErrorDto } from './intersolve-response-error.dto';

export class IntersolveGetVirtualCardResponseDto {
  public data: {
    success?: boolean;
    errors?: IntersolveReponseErrorDto[];
    data?: IntersolveGetVirtualCardResponseDataDto;
  };
  public status: number;
  public statusText: string;
}
export class IntersolveGetVirtualCardResponseDataDto {
  carddataurl: string;
  controltoken: string;
}
