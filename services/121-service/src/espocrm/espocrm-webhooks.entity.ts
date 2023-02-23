import { Column, Entity } from 'typeorm';
import { CascadeDeleteEntity } from '../base.entity';
import { EspocrmActionTypeEnum } from './espocrm-action-type.enum';
import { EspocrEntityTypeEnum } from './espocrm-entity-type';

@Entity('espocrm_webhook')
export class EspocrmWebhookEntity extends CascadeDeleteEntity {
  @Column()
  public actionType: EspocrmActionTypeEnum;

  @Column()
  public entityType: EspocrEntityTypeEnum;

  @Column()
  public secretKey: string;
}
