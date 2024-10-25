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
  notifyOnTransaction: boolean;
  attributes: { name: string; required: boolean }[];
}

export enum FspIntegrationType {
  api = 'api',
  csv = 'csv',
}
