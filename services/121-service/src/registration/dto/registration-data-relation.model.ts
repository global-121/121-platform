export class RegistrationDataRelation {
  public programQuestionId?: number;
  public fspQuestionId?: number;
  public programCustomAttributeId?: number;
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
  public fspId?: number;
}
