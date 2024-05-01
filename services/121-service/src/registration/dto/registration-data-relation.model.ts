export class RegistrationDataRelation {
  public programQuestionId?: number;
  public fspQuestionId?: number;
  public programCustomAttributeId?: number;
}

export class RegistrationDataOptions {
  public relation?: RegistrationDataRelation;
  public name?: string;
}

export class RegistrationDataInfo {
  public name: string;
  public relation: RegistrationDataRelation;
  public type: string;
  public fspId?: number;
}
