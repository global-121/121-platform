import { TranslatableString } from './translatable-string.model';

export class Program {
  id: number;
  title: string | TranslatableString;
  description: string | TranslatableString;
  countryId: number;
  created: string;
  updated: string;
  meetingDocuments?: string | TranslatableString;
  ngo: string;
  customCriteria: any[];
  credDefId: string;
}
