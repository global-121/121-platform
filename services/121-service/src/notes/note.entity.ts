import { Base121AuditedEntity } from '@121-service/src/base-audited.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { UserEntity } from '@121-service/src/user/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';

@Entity('note')
export class NoteEntity extends Base121AuditedEntity {
  @ManyToOne(() => RegistrationEntity, (registration) => registration.notes)
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column()
  public registrationId: number;

  @ManyToOne(() => UserEntity, (user) => user.notes)
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;

  @Column({ nullable: false })
  public text: string;
}
