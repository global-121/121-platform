export class IntersolveCreateCustomerDto {
  public externalReference: string;
  public individual: IntersolveIndividualDto;
  public contactInfo: IntersolveContactInfoDto;
}

class IntersolveIndividualDto {
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
}

export class IntersolveContactInfoDto {
  public addresses: IntersolveAddressDto[];
  public emailAddresses?: IntersolveTypeValue[];
  public phoneNumbers: IntersolveTypeValue[];
}

export class IntersolveAddressDto {
  public type: string;
  public addressLine1: string;
  public city: string;
  public region?: string;
  public postalCode: string;
  public country: string;
}

export class IntersolveTypeValue {
  public type: string;
  public value: string | null;
}
