export interface AllXlxsColumnsMapping {
  referenceId: string;
  id: string;
  status: string;
  phoneNumber: string;
  preferredLanguage: string;
  paymentAmountMultiplier: string;
  paymentCount: string;
  registrationCreatedDate: string;
  fspDisplayName: string;
  scope: string;
  namePartnerOrganization: string;
  fullName: string;
  whatsappPhoneNumber: string;
  addressCity: string;
  addressPostalCode: string;
  addressHouseNumberAddition: string;
  addressHouseNumber: string;
  addressStreet: string;
  changedAt: string;
  type: string;
  newValue: string;
  oldValue: string;
  name: string;
  fsp: string;
  duplicateWithIds: string;
}

export const allXlxsColumnsMapping: Record<
  keyof AllXlxsColumnsMapping,
  string
> = {
  referenceId: 'referenceid',
  id: 'id',
  status: 'status',
  phoneNumber: 'phonenumber',
  preferredLanguage: 'preferredlanguage',
  paymentAmountMultiplier: 'paymentamountmultiplier',
  paymentCount: 'paymentcount',
  registrationCreatedDate: 'registrationcreateddate',
  fspDisplayName: 'fspdisplayname',
  scope: 'scope',
  namePartnerOrganization: 'namepartnerorganization',
  fullName: 'fullname',
  whatsappPhoneNumber: 'whatsappphonenumber',
  addressCity: 'addresscity',
  addressPostalCode: 'addresspostalcode',
  addressHouseNumberAddition: 'addresshousenumberaddition',
  addressHouseNumber: 'addresshousenumber',
  addressStreet: 'addressstreet',
  changedAt: 'changedat',
  type: 'type',
  newValue: 'newvalue',
  oldValue: 'oldvalue',
  name: 'name',
  fsp: 'fsp',
  duplicateWithIds: 'duplicatewithids',
};
