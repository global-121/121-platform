// TODO: Renamed from IntersolveCreateCustomerDto, since this DTO is only used in IntersolveVisaModule, so the context is clearly Intersolve. Is that ok?
export class CreateCustomerDto {
  public readonly externalReference: string;
  public readonly name: string;
  public readonly addressStreet: string;
  public readonly addressHouseNumber: string;
  public readonly addressHouseNumberAddition: string;
  public readonly addressPostalCode: string;
  public readonly addressCity: string;
  public readonly phoneNumber: string;
  public readonly estimatedAnnualPaymentVolumeMajorUnit: number;
}
