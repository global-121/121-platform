import { UserEntity } from '../user/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Column,
  OneToMany,
  AfterUpdate,
  AfterInsert,
  Repository,
  UpdateEvent,
  getConnection,
  BeforeInsert,
} from 'typeorm';
import { ProgramEntity } from '../programs/program/program.entity';
import { RegistrationStatusEnum } from './registration-status.enum';
import { ProgramAnswersEntity } from './program-answer.entity';
import { RegistrationStatusChangeEntity } from './registration-status-change.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Entity('registration')
export class RegistrationEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @ManyToOne(
    type => ProgramEntity,
    program => program.registrations,
  )
  public program: ProgramEntity;

  @ManyToOne(() => UserEntity)
  public user: UserEntity;

  @OneToMany(
    () => RegistrationStatusChangeEntity,
    statusChange => statusChange.registration,
  )
  public statusChanges: RegistrationStatusChangeEntity[];

  @AfterUpdate()
  @BeforeInsert()
  public async storeRegistrationStatusChange(): Promise<void> {
    const registrationStatusChange = new RegistrationStatusChangeEntity();

    // const registration = await getConnection()
    //   .getRepository(RegistrationEntity)
    //   .findOne(this.id);

    registrationStatusChange.registrationStatus = this.registrationStatus;
    const savedRegistrationStatusChange = await getConnection()
      .getRepository(RegistrationStatusChangeEntity)
      .save(registrationStatusChange);

    this.statusChanges = [savedRegistrationStatusChange];
  }

  @Index()
  @Column()
  public registrationStatus: RegistrationStatusEnum;

  @Column({ nullable: true })
  public qrCode: string;

  @Index({ unique: true })
  @Column()
  public referenceId: string;

  @OneToMany(
    () => ProgramAnswersEntity,
    programAnswer => programAnswer.registration,
  )
  public programAnswers: ProgramAnswersEntity[];
}
