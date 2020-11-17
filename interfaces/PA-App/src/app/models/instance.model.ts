import { TranslatableString } from 'src/app/models/translatable-string.model';
import { Actor } from 'src/app/shared/actor.enum';

export class InstanceData {
  name: Actor;
  displayName: TranslatableString;
  dataPolicy: TranslatableString;
  contactDetails: TranslatableString;
  aboutProgram: TranslatableString;
  monitoringQuestion: string;
}

export class InstanceInformation {
  name: Actor;
  displayName: string;
  dataPolicy: string;
  contactDetails: string;
  aboutProgram: string;
  monitoringQuestion: string;
}

export class MonitoringData {
  intro: TranslatableString;
  options: string;
  conclusion: TranslatableString;
}

export class MonitoringInfo {
  intro: string;
  options: any[];
  conclusion: string;
}
