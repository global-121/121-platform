// TODO: Renamed from IntersolveCreateCustomerDto, since this DTO is only used in IntersolveVisaModule, so the context is clearly Intersolve. Is that ok?
export class CreateCustomerDto {
  public readonly externalReference: string;
  public readonly name: string;
  public readonly street: string;
  public readonly houseNumber: string;
  public readonly houseNumberAddition: string;
  public readonly postalCode: string;
  public readonly city: string;
  public readonly phoneNumber: string;
  public readonly estimatedAnnualPaymentVolumeMajorUnit: number;
}
