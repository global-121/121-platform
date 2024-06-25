export class CreatePhysicalCardRequestDto {
  public brand: 'VISA_CARD';
  public firstName: string;
  public lastName: string;
  public mobileNumber: string | null;
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
