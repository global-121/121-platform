export interface CreatePhysicalCardRequestDto {
  readonly brand: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly mobileNumber: string;
  readonly cardAddress: {
    readonly address1: string;
    readonly city: string;
    readonly country: string;
    readonly postalCode: string;
  };
  readonly pinAddress: {
    readonly address1: string;
    readonly city: string;
    readonly country: string;
    readonly postalCode: string;
  };
  readonly pinStatus: string;
  readonly coverLetterCode: string;
}
