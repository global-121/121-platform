export interface CreatePhysicalCardRequestIntersolveApiDto {
  readonly brand: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly mobileNumber: string;
  readonly cardAddress: AddressIntersolveApi;
  readonly pinAddress: AddressIntersolveApi;
  readonly pinStatus: string;
  readonly coverLetterCode: string;
}

interface AddressIntersolveApi {
  readonly address1: string;
  readonly city: string;
  readonly country: string;
  readonly postalCode: string;
}
