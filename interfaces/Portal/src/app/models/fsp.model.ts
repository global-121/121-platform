import FspName from '../enums/fsp-name.enum';
import { Attribute } from './attribute.model';
import { TranslatableString } from './translatable-string.model';

export class FinancialServiceProviderConfiguration {
  id: number;
  name: string;
  displayName: TranslatableString | string;
  editableAttributes?: Attribute[];
  financialServiceProviderName: FspName;
  financialServiceProvider: FinancialServiceProvider;
}

export class FinancialServiceProvider {
  integrationType: FspIntegrationType;
  hasReconciliation: boolean;
  notifyOnTransaction: boolean;
  attributes: { name: string; required: boolean }[];
}

export enum AnswerType {
  // Translate the types used in the API to internal, proper types:
  Number = 'numeric',
  Text = 'text',
  Date = 'date',
  Enum = 'dropdown',
  PhoneNumber = 'tel',
  Email = 'email',
  Boolean = 'boolean',
  MultiSelect = 'multi-select',
}
export class FspQuestion {
  id: number;
  name: string;
  answerType: AnswerType;
  label: TranslatableString;
  placeholder?: TranslatableString;
  options: FspAttributeOption[] | null;
  duplicateCheck: boolean;
}

export class FspAttributeOption {
  option: string;
  label: TranslatableString;
}

export enum FspIntegrationType {
  api = 'api',
  csv = 'csv',
}
