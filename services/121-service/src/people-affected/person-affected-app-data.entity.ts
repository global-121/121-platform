import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { Base121Entity } from '../base.entity';
import { UserEntity } from '../user/user.entity';

enum PaDataTypes {
  conversationHistory = 'conversationHistory',
  fsp = 'fsp',
  myAnswers = 'myAnswers',
  phoneNumber = 'phoneNumber',
  programId = 'programId',
  referenceId = 'referenceId',
  registrationStatus = 'registrationStatus',
  status = 'status',
  username = 'username',
}

// TODO: REFACTOR: rename so that class name of Entity corresponds to table name, e.g. table name person_affected_app_data
// XXX: Should this file still exist? If so, should it stay in this directory?
@Entity('people_affected_app_data')
export class PersonAffectedAppDataEntity extends Base121Entity {
  @Index()
  @Column()
  public type: PaDataTypes;

  @Column()
  public data: string;

  @ManyToOne(() => UserEntity, (user) => user.personAffectedAppData)
  public user: UserEntity;
}
