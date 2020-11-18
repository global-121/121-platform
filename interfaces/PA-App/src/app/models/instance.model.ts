import { TranslatableString } from 'src/app/models/translatable-string.model';
import { Actor } from 'src/app/shared/actor.enum';

export class InstanceData {
  name: Actor;
  displayName: TranslatableString;
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
  name: Actor;
  displayName: string;
  dataPolicy: string;
  contactDetails: string;
  aboutProgram: string;
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
