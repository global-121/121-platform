import { RegistrationAttributeTypes } from '@121-service/src/registration/enum/registration-attribute.enum';

export class RegistrationDataRelation {
  public projectRegistrationAttributeId: number;
}

interface RegistrationDataOpionsWithRequiredRelation {
  relation: RegistrationDataRelation;
  name?: string;
}
interface RegistrationDataOpionsWithRequiredName {
  relation?: RegistrationDataRelation;
  name: string;
}
export type RegistrationDataOptions =
  | RegistrationDataOpionsWithRequiredName
  | RegistrationDataOpionsWithRequiredRelation;

export class RegistrationDataInfo {
  public name: string;
  public relation: RegistrationDataRelation;
  public type: RegistrationAttributeTypes;
}
