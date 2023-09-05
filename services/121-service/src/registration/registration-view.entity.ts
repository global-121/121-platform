import {
  Column,
  DataSource,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  ViewColumn,
  ViewEntity,
} from 'typeorm';
import { FspName } from '../fsp/enum/fsp-name.enum';
import { ProgramEntity } from '../programs/program.entity';
import { LanguageEnum } from './enum/language.enum';
import { RegistrationStatusEnum } from './enum/registration-status.enum';
import { RegistrationDataEntity } from './registration-data.entity';
import { RegistrationEntity } from './registration.entity';

// TODO: REFACTOR: rename to RegistrationView, common practice is not to suffix an Entity class with "Entity" (also goes for non-view Entities), so that the default view or table name gets no suffix either
@ViewEntity({
  expression: (dataSource: DataSource) =>
    dataSource
      .createQueryBuilder()
      .select('registration.id', 'id')
      .from(RegistrationEntity, 'registration')
      .addSelect(
        `CAST(CONCAT('PA #',registration."registrationProgramId") as VARCHAR)`,
        'personAffectedSequence',
      )
      .addSelect(
        `registration."registrationProgramId"`,
        'registrationProgramId',
      )
      .orderBy(`registration.registrationProgramId`, 'ASC')
      .addSelect('registration.referenceId', 'referenceId')
      .addSelect('registration.registrationStatus', 'status')
      .addSelect('registration.programId', 'programId')
      .addSelect('registration.preferredLanguage', 'preferredLanguage')
      .addSelect('registration.inclusionScore', 'inclusionScore')
      .addSelect('registration.noteUpdated', 'noteUpdated')
      .addSelect('fsp.fsp', 'financialServiceProvider')
      .addSelect('fsp.fspDisplayNamePortal', 'fspDisplayNamePortal')
      .addSelect(
        'registration.paymentAmountMultiplier',
        'paymentAmountMultiplier',
      )
      .addSelect('registration.maxPayments', 'maxPayments')
      .addSelect('registration.phoneNumber', 'phoneNumber')
      .addSelect('registration.note', 'note')
      .leftJoin('registration.fsp', 'fsp'),
})
export class RegistrationViewEntity {
  @ViewColumn()
  @PrimaryColumn()
  public id: number;

  @ViewColumn()
  public status: RegistrationStatusEnum;

  @ManyToOne((_type) => ProgramEntity, (program) => program.registrations)
  @JoinColumn({ name: 'programId' })
  public program: ProgramEntity;
  @Column()
  public programId: number;

  @ViewColumn()
  public referenceId: string;

  @ViewColumn()
  public phoneNumber: string;

  @ViewColumn()
  public preferredLanguage: LanguageEnum;

  @ViewColumn()
  public inclusionScore: number;

  @ViewColumn()
  public paymentAmountMultiplier: number;

  @ViewColumn()
  public note: string;

  @ViewColumn()
  public noteUpdated: Date;

  @ViewColumn()
  public financialServiceProvider: FspName;

  @ViewColumn()
  public fspDisplayNamePortal: string;

  /** This is an "auto" incrementing field with a registration ID per program. */
  @ViewColumn()
  public registrationProgramId: number;

  @ViewColumn()
  public personAffectedSequence: string;

  @ViewColumn()
  public maxPayments: number;

  @OneToMany(
    () => RegistrationDataEntity,
    (registrationData) => registrationData.registration,
    {
      eager: true,
    },
  )
  public data: RegistrationDataEntity[];
}
