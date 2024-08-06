import { ContactInfo } from '@121-service/src/payments/fsp-integration/intersolve-visa/dtos/intersolve-api/partials/contact-info';

export interface CreateCustomerRequestDto {
  readonly externalReference: string;
  readonly individual: {
    readonly firstName?: string;
    readonly lastName: string;
    readonly middleName?: string;
    readonly initials?: string;
    readonly gender?: string;
    readonly dateOfBirth?: string;
    readonly countryOfBirth?: string;
    readonly nationality?: string;
    readonly culture?: string;
    readonly estimatedAnnualPaymentVolumeMajorUnit: number;
  };
  readonly contactInfo: ContactInfo;
}
