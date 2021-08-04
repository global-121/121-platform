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
}

export enum Language {
  en = 'en',
  ar = 'ar',
  ti = 'ti',
  tl = 'tl',
  ptBR = 'pt_BR',
  tuvKE = 'tuv_KE',
  saqKE = 'saq_KE',
  in = 'in',
  nl = 'nl',
}

export class Attribute {
  public attribute: string;
  public type: string;
}

export enum AnswerTypes {
  tel = 'tel',
}
