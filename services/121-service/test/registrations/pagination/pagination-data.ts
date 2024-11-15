import { FinancialServiceProviders } from '@121-service/src/financial-service-providers/enum/financial-service-provider-name.enum';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { LanguageEnum } from '@121-service/src/shared/enum/language.enums';
interface RegistrationWithFspName extends RegistrationEntity {
  fspName?: string;
}

export function createExpectedValueObject(
  registration: Partial<RegistrationWithFspName>,
  sequenceNumber: number,
): Partial<RegistrationEntity> {
  const expectedValueObject = {
    ...registration,
    financialServiceProvider: registration.fspName,
    registrationProgramId: sequenceNumber,
    personAffectedSequence: `PA #${sequenceNumber}`,
  };
  delete expectedValueObject.fspName;

  return expectedValueObject;
}

export const programIdPV = 2;
export const programIdOCW = 3;
export const programIdWesteros = 2;
export const programIdWithValidation = 3;

export const registrationOCW1 = {
  referenceId: '63e62864557597e0d',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  fullName: 'John Smith',
  phoneNumber: '14155236666',
  fspName: FinancialServiceProviders.intersolveVisa,
  whatsappPhoneNumber: '14155238886',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationOCW2 = {
  referenceId: '22e62864557597e0d',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  fullName: 'Anna Hello',
  phoneNumber: '14155237775',
  fspName: FinancialServiceProviders.intersolveVisa,
  whatsappPhoneNumber: '14155237775',
  addressStreet: 'Teststeeg',
  addressHouseNumber: '2',
  addressHouseNumberAddition: '',
  addressPostalCode: '2345AB',
  addressCity: 'AnotherCity',
};

export const registrationOCW3 = {
  referenceId: '43e62864557597e0d',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 2,
  fullName: 'Sophia Johnson',
  phoneNumber: '14155236666',
  fspName: FinancialServiceProviders.intersolveVisa,
  whatsappPhoneNumber: '14155236666',
  addressStreet: 'DifferentStreet',
  addressHouseNumber: '3',
  addressHouseNumberAddition: 'B',
  addressPostalCode: '3456CD',
  addressCity: 'DifferentCity',
};

export const registrationOCW4 = {
  referenceId: '54e62864557597e0d',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 3,
  fullName: 'Luiz Garcia',
  phoneNumber: '14155235555',
  fspName: FinancialServiceProviders.intersolveVisa,
  whatsappPhoneNumber: '14155235555',
  addressStreet: 'AnotherStreet',
  addressHouseNumber: '4',
  addressHouseNumberAddition: 'C',
  addressPostalCode: '4567DE',
  addressCity: 'AnotherCity',
};

export const registrationOCW5 = {
  referenceId: '54e62864557597e034',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 3,
  fullName: 'Lars Larsson',
  phoneNumber: '14155235556',
  fspName: FinancialServiceProviders.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235556',
};

export const registrationsOCW = [
  registrationOCW1,
  registrationOCW2,
  registrationOCW3,
  registrationOCW4,
  registrationOCW5,
];

export const registrationPV5 = {
  referenceId: '44e62864557597e0d',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Gemma Houtenbos',
  phoneNumber: '14155235556',
  fspName: FinancialServiceProviders.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235555',
};

export const registrationPV6 = {
  referenceId: 'asdf234f4gg4ag64545',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Jan Janssen',
  phoneNumber: '14155235551',
  fspName: FinancialServiceProviders.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235551',
};

export const registrationPV7 = {
  referenceId: 'asdf234f4gg4ag64547',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Joost Herlembach',
  phoneNumber: '14155235551',
  fspName: FinancialServiceProviders.intersolveVisa,
  whatsappPhoneNumber: '14155235551',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationPV8 = {
  referenceId: 'asdf234f4gg4ag64567',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  fullName: 'Jack Strong',
  phoneNumber: '14155235557',
  fspName: FinancialServiceProviders.intersolveVisa,
  whatsappPhoneNumber: '14155235557',
  addressStreet: 'Teststraat',
  addressHouseNumber: '1',
  addressHouseNumberAddition: '',
  addressPostalCode: '1234AB',
  addressCity: 'Stad',
};

export const registrationsPV = [
  registrationPV5,
  registrationPV6,
  registrationPV7,
  registrationPV8,
];

export const registrationPvScoped = {
  referenceId: '434e62869242497e1e',
  preferredLanguage: LanguageEnum.nl,
  paymentAmountMultiplier: 1,
  fullName: 'Freya Midgard',
  phoneNumber: '14155235554',
  fspName: FinancialServiceProviders.intersolveVoucherWhatsapp,
  whatsappPhoneNumber: '14155235554',
  scope: 'utrecht',
};

export const expectedAttributes = [
  'id',
  'status',
  'referenceId',
  'phoneNumber',
  'preferredLanguage',
  'inclusionScore',
  'paymentAmountMultiplier',
  'financialServiceProvider',
  'registrationProgramId',
  'personAffectedSequence',
  'name',
  'paymentCount',
];

export const registrationWesteros1 = {
  referenceId: 'westeros123456789',
  preferredLanguage: 'en',
  name: 'John Snow',
  dob: '283-12-31',
  house: 'stark',
  dragon: 1,
  knowsNothing: true,
  phoneNumber: '14155235554',
  fspName: 'Excel',
  whatsappPhoneNumber: '14155235554',
  motto: 'Winter is coming',
};

export const registrationWesteros2 = {
  referenceId: 'westeros987654321',
  preferredLanguage: 'en',
  name: 'Arya Stark',
  dob: '288-12-31',
  house: 'stark',
  dragon: 0,
  knowsNothing: false,
  phoneNumber: '14155235555',
  fspName: 'Excel',
  whatsappPhoneNumber: '14155235555',
  motto: 'A girl has no name',
};

export const registrationSafaricom = {
  referenceId: '01dc9451-1273-484c-b2e8-ae21b51a96ab',
  fspName: FinancialServiceProviders.safaricom,
  phoneNumber: '254708374149',
  preferredLanguage: LanguageEnum.en,
  paymentAmountMultiplier: 1,
  maxPayments: 6,
  fullName: 'Barbara Floyd',
  gender: 'male',
  age: 25,
  maritalStatus: 'married',
  registrationType: 'self',
  nationalId: '32121321',
  nameAlternate: 'test',
  totalHH: 56,
  totalSub5: 1,
  totalAbove60: 1,
  otherSocialAssistance: 'no',
  county: 'ethiopia',
  subCounty: 'ethiopia',
  ward: 'dsa',
  location: 21,
  subLocation: 2113,
  village: 'adis abea',
  nearestSchool: 213321,
  areaType: 'urban',
  mainSourceLivelihood: 'salary_from_formal_employment',
  mainSourceLivelihoodOther: 213,
  Male05: 1,
  Female05: 0,
  Male612: 0,
  Female612: 0,
  Male1324: 0,
  Female1324: 0,
  Male2559: 0,
  Female2559: 0,
  Male60: 0,
  Female60: 0,
  maleTotal: 0,
  femaleTotal: 0,
  householdMembersDisability: 'no',
  disabilityAmount: 0,
  householdMembersChronicIllness: 'no',
  chronicIllnessAmount: 0,
  householdMembersPregnantLactating: 'no',
  pregnantLactatingAmount: 0,
  habitableRooms: 0,
  tenureStatusOfDwelling: 'Owner occupied',
  ownerOccupiedState: 'purchased',
  ownerOccupiedStateOther: 0,
  rentedFrom: 'individual',
  rentedFromOther: 0,
  constructionMaterialRoof: 'tin',
  ifRoofOtherSpecify: 31213,
  constructionMaterialWall: 'tiles',
  ifWallOtherSpecify: 231312,
  constructionMaterialFloor: 'cement',
  ifFloorOtherSpecify: 'asdsd',
  dwellingRisk: 'fire',
  ifRiskOtherSpecify: 123213,
  mainSourceOfWater: 'lake',
  ifWaterOtherSpecify: 'dasdas',
  pigs: 'no',
  ifYesPigs: 123123,
  chicken: 'no',
  mainModeHumanWasteDisposal: 'septic_tank',
  ifHumanWasteOtherSpecify: 31213,
  cookingFuel: 'electricity',
  ifFuelOtherSpecify: 'asdsda',
  Lighting: 'electricity',
  ifLightingOtherSpecify: 'dasasd',
  householdItems: 'none',
  excoticCattle: 'no',
  ifYesExoticCattle: 12231123,
  IndigenousCattle: 'no',
  ifYesIndigenousCattle: 123132123,
  sheep: 'no',
  ifYesSheep: 12312312,
  goats: 'no',
  ifYesGoats: 312123,
  camels: 'no',
  ifYesCamels: 312123,
  donkeys: 'no',
  ifYesDonkeys: 213312,
  ifYesChicken: 2,
  howManyBirths: 0,
  howManyDeaths: 0,
  householdConditions: 'poor',
  skipMeals: 'no',
  receivingBenefits: 0,
  ifYesNameProgramme: 0,
  typeOfBenefit: 'in_kind',
  ifOtherBenefit: 2123312,
  ifCash: 12312,
  ifInKind: 132132,
  feedbackOnRespons: 'no',
  ifYesFeedback: 312123,
  whoDecidesHowToSpend: 'male_household_head',
  possibilityForConflicts: 'no',
  genderedDivision: 'no',
  ifYesElaborate: 'asddas',
  geopoint: 123231,
};

export const registrationsSafaricom = [registrationSafaricom];
