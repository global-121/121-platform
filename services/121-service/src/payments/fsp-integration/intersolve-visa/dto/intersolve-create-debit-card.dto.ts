import { IntersolveReponseErrorDto } from './intersolve-response-error.dto';

export class IntersolveCreateDebitCardDto {
  public brand: 'VISA_CARD';
  public firstName: string;
  public lastName: string;
  public mobileNumber: '';
  public cardAddress: {
    address1: string;
    city: string;
    country: 'NL';
    postalCode: string;
  };
  public pinAddress: {
    address1: string;
    city: string;
    country: 'NL';
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
