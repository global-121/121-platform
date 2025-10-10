import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { Fsps } from '@121-service/src/fsps/enums/fsp-name.enum';
import { TransactionEventEntity } from '@121-service/src/payments/transactions/transaction-events/entities/transaction-event.entity';
import { ProgramFspConfigurationPropertyEntity } from '@121-service/src/program-fsp-configurations/entities/program-fsp-configuration-property.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

@Unique('programFspConfigurationUnique', ['programId', 'name'])
@Entity('program_fsp_configuration')
export class ProgramFspConfigurationEntity extends Base121Entity {
  @ManyToOne(
    (_type) => ProgramEntity,
    (program) => program.programFspConfigurations,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'programId' })
  @Column()
  public programId: number;

  @Column({ type: 'character varying' })
  public fspName: Fsps;

  @Column({ type: 'character varying' })
  public name: string;

  @Column('json')
  public label: LocalizedString;

  @OneToMany(
    (_type) => ProgramFspConfigurationPropertyEntity,
    (programFspConfigurationProperty) =>
      programFspConfigurationProperty.programFspConfiguration,
    { cascade: ['insert'] },
  )
  public properties: Relation<ProgramFspConfigurationPropertyEntity[]>;

  @OneToMany(
    (_type) => TransactionEventEntity,
    (transactionEvent) => transactionEvent.programFspConfiguration,
  )
  public transactionEvents: Relation<TransactionEventEntity[]>;

  @OneToMany(
    (_type) => RegistrationEntity,
    (registrations) => registrations.programFspConfiguration,
  )
  public registrations: Relation<RegistrationEntity[]>;
}
