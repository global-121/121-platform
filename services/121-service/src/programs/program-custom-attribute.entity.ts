import {
  BeforeRemove,
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
  Unique,
} from 'typeorm';

import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { CustomAttributeType } from '@121-service/src/programs/dto/create-program-custom-attribute.dto';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { RegistrationDataEntity } from '@121-service/src/registration/registration-data.entity';
import { NameConstraintQuestions } from '@121-service/src/shared/const';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';

@Unique('programCustomAttributeUnique', ['name', 'programId'])
@Entity('program_custom_attribute')
@Check(`"name" NOT IN (${NameConstraintQuestions})`)
export class ProgramCustomAttributeEntity extends CascadeDeleteEntity {
  @Column()
  public name: string;

  @Column({ type: 'character varying' })
  public type: CustomAttributeType;

  @Column('json')
  public label: LocalizedString;

  @Column({ default: false })
  public showInPeopleAffectedTable: boolean;

  @Column({ default: false })
  public duplicateCheck: boolean;

  @ManyToOne(
    (_type) => ProgramEntity,
    (program) => program.programCustomAttributes,
  )
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;

  @Column()
  public programId: number;

  @OneToMany(
    () => RegistrationDataEntity,
    (registrationData) => registrationData.programCustomAttribute,
  )
  public registrationData: Relation<RegistrationDataEntity[]>;

  @BeforeRemove()
  public async cascadeDelete(): Promise<void> {
    await this.deleteAllOneToMany([
      {
        entityClass: RegistrationDataEntity,
        columnName: 'programCustomAttributeId',
      },
    ]);
  }
}
