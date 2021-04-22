import { ProgramAttribute } from './program.model';

export class PaDataAttribute {
  answer: string;
  attribute: string;
  attributeId: number;
  referenceId: string;
  id: number;
  programId: number;
}

export class ValidatedPaData {
  referenceId: string;
  programId: number;
  attributes?: ProgramAnswer[];
  fspanswers?: FspAnswer[];
}

export class ProgramAnswer extends ProgramAttribute {}

export class FspAnswer {
  referenceId: string;
  code: string;
  value: string;
}
