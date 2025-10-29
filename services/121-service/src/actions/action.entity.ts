import { Column, Entity, ManyToOne, Relation } from 'typeorm';

import { ActionType } from '@121-service/src/actions/enum/action-type.enum';
import { Base121AuditedEntity } from '@121-service/src/base-audited.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Entity('action')
export class ActionEntity extends Base121AuditedEntity {
  @Column({ type: 'character varying' })
  public actionType: ActionType;

  @ManyToOne((_type) => UserEntity, (user) => user.actions, {
    onDelete: 'NO ACTION', // Do not delete on deleting users, instead see catch in userService.delete()
  })
  public user: Relation<UserEntity>;

  @ManyToOne((_type) => ProgramEntity, (program) => program.actions, {
    onDelete: 'CASCADE',
  })
  public program: Relation<ProgramEntity>;
}
