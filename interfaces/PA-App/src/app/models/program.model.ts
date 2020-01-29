import { Fsp } from './fsp.model';

export class Program {
  id: number;
  title: string;
  description: string;
  countryId: number;
  created: string;
  updated: string;
  meetingDocuments: any;
  ngo: string;
  customCriteria: any[];
  financialServiceProviders: Fsp[];
  credDefId: string;
}

export class ProgramAttribute {
  attributeId: number;
  attribute: string;
  answer: string;
}
