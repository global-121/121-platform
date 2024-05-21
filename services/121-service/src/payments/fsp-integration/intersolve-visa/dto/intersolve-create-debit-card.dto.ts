import { IntersolveReponseErrorDto } from '@121-service/src/payments/fsp-integration/intersolve-visa/dto/intersolve-response-error.dto';

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
  public coverLetterCode: string;
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
