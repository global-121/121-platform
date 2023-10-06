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
    region?: string;
  };
  public pinAddress: {
    address1: string;
    city: string;
    country: 'NLD';
    postalCode: string;
    region?: string;
  };
  public expiration?: {
    month: number;
    year: number;
  };
  public pinStatus: 'D';
}

export class IntersolveCreateDebitCardResponseDto {
  public data: {
    success?: boolean;
    errors?: IntersolveReponseErrorDto[];
    code?: string;
    correlationId?: string;
  };
  public status: number;
  public statusText: string;
}
