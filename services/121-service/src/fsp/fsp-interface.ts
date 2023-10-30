import { FspQuestionEntity } from './fsp-question.entity';

export interface FspAnswersAttrInterface {
  attributes: FspQuestionEntity[];
  answers: AnswerSet;
  referenceId: string;
}

export interface Answer {
  code: string;
  value: string;
  label: string;
}

export type AnswerSet = Record<string, Answer>;
