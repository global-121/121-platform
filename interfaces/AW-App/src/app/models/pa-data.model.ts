import { Program, ProgramAttribute } from './program.model';

export class PaProgramAnswer {
  value: string;
  name: string;
  attributeId: number;
  referenceId: string;
  id: number;
  programId: number;
}

export class Registration {
  public programAnswers: PaProgramAnswer[];
  public program: Program;
  public referenceId: string;
}

export class ValidatedPaData {
  referenceId: string;
  programId: number;
  programAnswers?: ProgramAnswer[];
  fspanswers?: FspAnswer[];
}

export class ProgramAnswer extends ProgramAttribute {}

export class FspAnswer {
  referenceId: string;
  code: string;
  value: string;
}
