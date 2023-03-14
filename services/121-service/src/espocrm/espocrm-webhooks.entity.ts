import { Column, Entity, Unique } from 'typeorm';
import { CascadeDeleteEntity } from '../base.entity';
import { EspocrmActionTypeEnum } from './espocrm-action-type.enum';
import { EspocrEntityTypeEnum } from './espocrm-entity-type';

@Unique('espocrmWebhookActionTypeEnityType', ['actionType', 'entityType'])
@Entity('espocrm_webhook')
export class EspocrmWebhookEntity extends CascadeDeleteEntity {
  @Column()
  public referenceId: string;

  @Column()
  public actionType: EspocrmActionTypeEnum;

  @Column()
  public entityType: EspocrEntityTypeEnum;

  @Column()
  public secretKey: string;
}
