export enum CustomDataAttributes {
  phoneNumber = 'phoneNumber',
  whatsappPhoneNumber = 'whatsappPhoneNumber',
  name = 'name',
  nameFirst = 'nameFirst',
  nameLast = 'nameLast',
  firstName = 'firstName',
  secondName = 'secondName',
  thirdName = 'thirdName',
}

export enum GenericAttributes {
  phoneNumber = 'phoneNumber',
  preferredLanguage = 'preferredLanguage',
  namePartnerOrganization = 'namePartnerOrganization',
  fspName = 'fspName',
  paymentAmountMultiplier = 'paymentAmountMultiplier',
}

export class Attribute {
  public attribute: string;
  public type: string;
}

export enum AnswerTypes {
  tel = 'tel',
  dropdown = 'dropdown',
}
