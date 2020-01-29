export enum AnswerType {
  // Translate the types used in the API to internal, proper types:
  Number = 'numeric',
  Text = 'text',
  Date = 'date',
  Enum = 'dropdown'
}

export class Question {
  id: number;
  code: string;
  answerType: AnswerType;
  label: string;
  options: QuestionOption[];
}

export class QuestionOption {
  id: number;
  value: string;
  label: string;
}

export class Answer {
  code: string;
  value: string;
  label: string;
}
