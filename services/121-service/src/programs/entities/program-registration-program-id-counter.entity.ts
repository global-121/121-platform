import { Column, Entity, Index, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';

@Entity('program_registration_program_id_counter')
export class ProgramRegistrationProgramIdCounterEntity extends Base121Entity {
  @OneToOne(
    () => ProgramEntity,
    (program) => program.registrationProgramIdCounter,
    {
      onDelete: 'CASCADE',
    },
  )
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;

  @Index({ unique: true })
  @Column({ type: 'int', nullable: false })
  public programId: number;

  @Column({ type: 'int', default: 0, nullable: false })
  public lastRegistrationProgramId: number;
}
