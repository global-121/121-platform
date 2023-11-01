import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ScopedBase121Entity } from '../base.entity';
import { RegistrationEntity } from '../registration/registration.entity';
import { UserEntity } from '../user/user.entity';

@Entity('note')
export class NoteEntity extends ScopedBase121Entity {
  @ManyToOne(() => RegistrationEntity, (registration) => registration.notes)
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Column()
  public registrationId: number;

  @ManyToOne(() => UserEntity, (user) => user.notes)
  @JoinColumn({ name: 'userId' })
  public user: UserEntity;
  @Column()
  public userId: number;

  @Column({ nullable: false })
  public text: string;
}
