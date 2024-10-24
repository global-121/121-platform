export class RegistrationDataRelation {
  public programRegistrationAttributeId?: number;
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
  public type: string;
}
