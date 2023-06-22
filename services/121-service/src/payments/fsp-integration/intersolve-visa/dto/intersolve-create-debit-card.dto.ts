import { IntersolveReponseErrorDto } from './intersolve-response-error.dto';

export class IntersolveCreateDebitCardDto {
  public brand: 'VISA_CARD';
  public firstName: string;
  public lastName: string;
  public mobileNumber: string;
  public cardAddress: {
    address1: string;
    city: string;
    country: 'NLD';
    postalCode: string;
  };
  public pinAddress: {
    address1: string;
    city: string;
    country: 'NLD';
    postalCode: string;
  };
  public expiration?: {
    month: number;
    year: number;
  };
}

export class IntersolveCreateDebitCardResponseDto {
  public data: {
    success?: boolean;
    errors?: IntersolveReponseErrorDto[];
    code?: string;
  };
  public status: number;
  public statusText: string;
}
