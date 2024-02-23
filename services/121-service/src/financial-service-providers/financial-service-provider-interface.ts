import { FinancialServiceProviderAttributeEntity } from './financial-service-provider-attribute.entity';

export interface FspAnswersAttrInterface {
  attributes: FinancialServiceProviderAttributeEntity[];
  answers: AnswerSet;
  referenceId: string;
}

export interface Answer {
  code: string;
  value: string;
  label: string;
}

export type AnswerSet = Record<string, Answer>;
