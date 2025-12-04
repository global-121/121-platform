export interface CustomerIndividualIntersolveApiDto {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  initials?: string;
  gender?: string;
  dateOfBirth?: string;
  countryOfBirth?: string;
  nationality?: string;
  culture?: string;
  extensions?: {
    type?: string;
    key?: string;
    values?: string[];
  }[];
  estimatedAnnualPaymentVolumeMajorUnit?: number;
  kycStatus?: string;
  kycRedirectUrl?: string;
  rejectionReason?: string;
}
