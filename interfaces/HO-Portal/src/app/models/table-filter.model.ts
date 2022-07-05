export enum TableFilterType {
  multipleChoice = 'multiple-choice',
}

export class TableFilterMultipleChoiceProps {
  allOptions: TableFilterMultipleChoiceOption[];
  currentSelection: string[];
}

export class TableFilterMultipleChoiceOption {
  name: string;
  label: string;
  count?: number;
}
