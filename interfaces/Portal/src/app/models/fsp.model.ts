import FspName from '../enums/fsp-name.enum';
import { Attribute } from './attribute.model';
import { TranslatableString } from './translatable-string.model';

export class FinancialServiceProviderConfiguration {
  id: number;
  name: string;
  label: TranslatableString | string;
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

export enum FspIntegrationType {
  api = 'api',
  csv = 'csv',
  xml = 'xml',
}
