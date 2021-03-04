import { TranslatableString } from './translatable-string.model';

export class InstanceData {
  name: string;
  displayName: TranslatableString;
  logoUrl: TranslatableString;
}

export class InstanceInformation {
  name: string;
  displayName: string;
  logoUrl: string;
}
