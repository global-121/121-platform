import { TranslatableString } from 'src/app/models/translatable-string.model';
import { Actor } from 'src/app/shared/actor.enum';

export class InstanceData {
  name: Actor;
  displayName: TranslatableString;
  dataPolicy: TranslatableString;
  contactDetails: TranslatableString;
  aboutProgram: TranslatableString;
  monitoringQuestion: MonitoringData;
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
  option1: TranslatableString;
  option2: TranslatableString;
  option3: TranslatableString;
  option4: TranslatableString;
  conclusion: TranslatableString;
}

export class MonitoringInfo {
  intro: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  conclusion: string;
}
