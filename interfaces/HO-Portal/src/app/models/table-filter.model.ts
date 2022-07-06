export enum TableFilterType {
  multipleChoice = 'multiple-choice',
}

export class TableFilterMultipleChoiceProps {
  allOptions: TableFilterMultipleChoiceOption[];
  currentSelection: TableFilterMultipleChoiceOutput;
}

export class TableFilterMultipleChoiceOption {
  name: string;
  label: string;
  count?: number;
}

export class TableFilterMultipleChoiceState {
  [key: string]: boolean;
}

export type TableFilterMultipleChoiceOutput =
  TableFilterMultipleChoiceOption['name'][];
