import { Column, Entity, Unique } from 'typeorm';
import { CascadeDeleteEntity } from '../base.entity';
import { EspoCrmActionTypeEnum } from './espocrm-action-type.enum';
import { EspoCrmEntityTypeEnum } from './espocrm-entity-type';

@Unique('espocrmWebhookActionTypeEnityType', ['actionType', 'entityType'])
@Entity('espocrm_webhook')
export class EspocrmWebhookEntity extends CascadeDeleteEntity {
  @Column()
  public referenceId: string;

  @Column()
  public actionType: EspoCrmActionTypeEnum;

  @Column()
  public entityType: EspoCrmEntityTypeEnum;

  @Column()
  public secretKey: string;
}
