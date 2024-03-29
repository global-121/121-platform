export enum AnswerType {
  // Translate the types used in the API to internal, proper types:
  Number = 'numeric',
  Text = 'text',
  Date = 'date',
  Enum = 'dropdown',
  PhoneNumber = 'tel',
  Email = 'email',
  MultiSelect = 'multi-select',
}

export class Question {
  code: string;
  answerType: AnswerType;
  label: string;
  placeholder?: string;
  pattern?: string;
  options: QuestionOption[] | null;
}

export class QuestionOption {
  value: string;
  label: string;
}

export class Answer {
  code: string;
  value: string | string[];
  label: string | string[];
}

export class AnswerSet {
  [code: string]: Answer;
}
