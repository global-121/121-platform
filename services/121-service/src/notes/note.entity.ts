import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';

import { Base121AuditedEntity } from '@121-service/src/base-audited.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Entity('note')
export class NoteEntity extends Base121AuditedEntity {
  @ManyToOne(() => RegistrationEntity, (registration) => registration.notes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column()
  public registrationId: number;

  @ManyToOne(() => UserEntity, (user) => user.notes, { onDelete: 'NO ACTION' }) // Do not delete on deleting users, instead see catch in userService.delete()
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;

  @Column({ nullable: false })
  public text: string;
}
