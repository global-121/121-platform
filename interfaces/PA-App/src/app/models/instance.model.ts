import { TranslatableString } from 'src/app/models/translatable-string.model';
import { Actor } from 'src/app/shared/actor.enum';

export class InstanceInformation {
  name: Actor;
  displayName: string | TranslatableString;
  dataPolicy: string | TranslatableString;
}
