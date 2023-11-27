export enum TableFilterType {
  multipleChoice = 'multiple-choice',
}

export class TableFilterMultipleChoiceProps {
  allOptions: TableFilterMultipleChoiceOption[];
  currentSelection: TableFilterMultipleChoiceOutput;
}

export class TableFilterMultipleChoiceOption {
  value: string | number;
  label: string;
  count?: number;
}

export class TableFilterMultipleChoiceState {
  options: { [key: string]: boolean };
  selectAll: boolean;
  totalCount: number;
}

export type TableFilterMultipleChoiceOutput =
  TableFilterMultipleChoiceOption['value'][];
