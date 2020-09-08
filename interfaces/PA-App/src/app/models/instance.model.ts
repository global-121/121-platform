import { TranslatableString } from './translatable-string.model';

export class InstanceInfo {
  name: string;
  displayName: string | TranslatableString;
  dataPolicy: string | TranslatableString;
}
