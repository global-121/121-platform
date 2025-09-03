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
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProjectFspConfigurationPropertyEntity } from '@121-service/src/project-fsp-configurations/entities/project-fsp-configuration-property.entity';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

@Unique('projectFspConfigurationUnique', ['projectId', 'name'])
@Entity('project_fsp_configuration')
export class ProjectFspConfigurationEntity extends Base121Entity {
  @ManyToOne(
    (_type) => ProjectEntity,
    (project) => project.projectFspConfigurations,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'projectId' })
  @Column()
  public projectId: number;

  @Column({ type: 'character varying' })
  public fspName: Fsps;

  @Column({ type: 'character varying' })
  public name: string;

  @Column('json')
  public label: LocalizedString;

  @OneToMany(
    (_type) => ProjectFspConfigurationPropertyEntity,
    (projectFspConfigurationProperty) =>
      projectFspConfigurationProperty.projectFspConfiguration,
    { cascade: ['insert'] },
  )
  public properties: Relation<ProjectFspConfigurationPropertyEntity[]>;

  @OneToMany(
    (_type) => TransactionEntity,
    (transactions) => transactions.projectFspConfiguration,
  )
  public transactions: Relation<TransactionEntity[]>;

  @OneToMany(
    (_type) => RegistrationEntity,
    (registrations) => registrations.projectFspConfiguration,
  )
  public registrations: Relation<RegistrationEntity[]>;
}
