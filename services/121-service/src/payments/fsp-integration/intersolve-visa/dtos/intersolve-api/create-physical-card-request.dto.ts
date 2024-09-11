export interface CreatePhysicalCardRequestDto {
  readonly brand: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly mobileNumber: string;
  readonly cardAddress: Address;
  readonly pinAddress: Address;
  readonly pinStatus: string;
  readonly coverLetterCode: string;
}

interface Address {
  readonly address1: string;
  readonly city: string;
  readonly country: string;
  readonly postalCode: string;
}
