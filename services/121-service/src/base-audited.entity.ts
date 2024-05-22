import { Base121Entity } from '@121-service/src/base.entity';
import { Column } from 'typeorm';

export class Base121AuditedEntity extends Base121Entity {
  @Column()
  public userId: number;
}

// Base121OptionalAuditedEntity is needed for cases where the userId is not mandatory.
// In some entities the userId is not applicable (e.g event entity of type registrationStatusChange
// where status changes are done by the system, such as moving to status completed).
export class Base121OptionalAuditedEntity extends Base121Entity {
  @Column({ nullable: true })
  public userId: number | null;
}
