import { AnswerTypes } from '../../registration/enum/custom-data-attributes';

export class ProgramQuestionForExport {
  public programQuestion: string;
  public answerType: AnswerTypes;
  public options: any[];
  public export: string[];
}
