export interface ContactInformation {
  readonly addressStreet: string;
  readonly addressHouseNumber: string;
  readonly addressHouseNumberAddition?: string;
  readonly addressPostalCode: string;
  readonly addressCity: string;
  readonly addressCountry: string; // In ISO 3166-1 alpha-3 format
  readonly phoneNumber: string;
}
