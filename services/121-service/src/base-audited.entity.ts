import { Column } from 'typeorm';
import { Base121Entity } from './base.entity';

export class Base121AuditedEntity extends Base121Entity {
  @Column()
  public userId: number;
}
