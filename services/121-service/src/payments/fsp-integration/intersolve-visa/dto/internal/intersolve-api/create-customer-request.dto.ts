// TODO: Renamed from IntersolveCreateCustomerDto, since this DTO is only used in IntersolveVisaModule, so the context is clearly Intersolve. Is that ok?
export class CreateCustomerRequestDto {
  public readonly externalReference: string;
  public individual: {
    firstName?: string;
    lastName: string;
    middleName?: string;
    initials?: string;
    gender?: string;
    dateOfBirth?: string;
    countryOfBirth?: string;
    nationality?: string;
    culture?: string;
    estimatedAnnualPaymentVolumeMajorUnit: number;
  };
  public readonly contactInfo: ContactInformation;
}

// Renamed from IntersolveIndividualDto
// Merged into CreateCustomerRequestDto
/*class Individual {
  public firstName?: string;
  public lastName: string;
  public middleName?: string;
  public initials?: string;
  public gender?: string;
  public dateOfBirth?: string;
  public countryOfBirth?: string;
  public nationality?: string;
  public culture?: string;
  public estimatedAnnualPaymentVolumeMajorUnit: number;
}*/

// TODO: Renamed from IntersolveContactInfoDto, since this is a partial DTO and only used in IntersolveVisaModule, so the context is clearly Intersolve. Is that ok?
// TODO: Every DTO and Partial in its own file
export class ContactInformation {
  public readonly addresses: AddressDto[];
  public emailAddresses?: TypeValue[];
  public readonly phoneNumbers: TypeValue[];
}

// TODO: Renamed from IntersolveAddressDto, since this DTO is only used in IntersolveVisaModule, so the context is clearly Intersolve. Is that ok?
// TODO: Every DTO and Partial in its own file
export class AddressDto {
  public readonly type: string;
  public readonly addressLine1: string;
  public readonly city: string;
  public readonly region?: string;
  public readonly postalCode: string;
  public readonly country: string;
}

// TODO: Renamed from IntersolveTypeValue, since this is a partial DTO and only used in IntersolveVisaModule, so the context is clearly Intersolve. Is that ok?
// TODO: Every DTO and Partial in its own file
export class TypeValue {
  public type: string;
  public value: string | null;
}
