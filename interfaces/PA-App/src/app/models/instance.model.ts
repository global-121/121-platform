import { TranslatableString } from 'src/app/models/translatable-string.model';

export class InstanceData {
  name: string;
  displayName: TranslatableString;
  logoUrl?: TranslatableString;
  dataPolicy: TranslatableString;
  contactDetails?: TranslatableString;
  aboutProgram: TranslatableString;
  monitoringQuestion?: MonitoringData;
}

export class MonitoringData {
  intro: TranslatableString;
  options: {
    option: string;
    label: TranslatableString;
  }[];
  conclusion: TranslatableString;
}

export class InstanceInformation {
  name: string;
  displayName: string;
  logoUrl: string;
  dataPolicy: string;
  contactDetails: string;
  monitoringQuestion: MonitoringInfo | null;
}

export class MonitoringInfo {
  intro: string;
  options: {
    option: string;
    label: string;
  }[];
  conclusion: string;
}
