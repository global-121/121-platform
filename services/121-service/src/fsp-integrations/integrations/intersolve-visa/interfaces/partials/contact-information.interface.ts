export interface ContactInformation {
  readonly name: string;
  readonly addressStreet: string;
  readonly addressHouseNumber: string;
  readonly addressHouseNumberAddition?: string;
  readonly addressPostalCode: string;
  readonly addressCity: string;
  readonly phoneNumber: string;
}
