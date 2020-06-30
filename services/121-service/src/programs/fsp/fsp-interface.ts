import { FspAttributeEntity } from './fsp-attribute.entity';

export interface FspAnswersAttrInterface {
  attributes: FspAttributeEntity[];
  answers: AnswerSet;
  did: string;
}

export interface Answer {
  code: string;
  value: string;
  label: string;
}

export interface AnswerSet {
  [code: string]: Answer;
}
