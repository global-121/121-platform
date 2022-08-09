export class RegistrationDataRelation {
  public programQuestionId?: number;
  public fspQuestionId?: number;
  public monitoringQuestionId?: number;
  public programCustomAttributeId?: number;
}

export class RegistrationDataOptions {
  public relation?: RegistrationDataRelation;
  public name?: string;
}
