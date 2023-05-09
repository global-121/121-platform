import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';
import { CascadeDeleteEntity } from './../base.entity';
import { ProgramEntity } from './program.entity';

@Unique('programFspConfigurationUnique', ['programId', 'fspId', 'name'])
@Entity('program_fsp_configuration')
export class ProgramFspConfigurationEntity extends CascadeDeleteEntity {
  @ManyToOne(
    (_type) => ProgramEntity,
    (program) => program.programFspConfiguration,
  )
  @JoinColumn({ name: 'programId' })
  @Column()
  public programId: number;

  @ManyToOne(() => FinancialServiceProviderEntity)
  @JoinColumn({ name: 'fspId' })
  @Column()
  fspId: number;

  @Column() name: string;

  @Column() value: string;
}
