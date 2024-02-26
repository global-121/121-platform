import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { CascadeDeleteEntity } from '../../base.entity';
import { FinancialServiceProviderEntity } from '../../fsp/financial-service-provider.entity';
import { ProgramEntity } from '../program.entity';

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

  @ManyToOne(
    (_type) => FinancialServiceProviderEntity,
    (fsp) => fsp.configuration,
  )
  @JoinColumn({ name: 'fspId' })
  public fsp: FinancialServiceProviderEntity;
  @Column()
  public fspId: number;

  @Column()
  public name: string;

  @Column()
  public value: string;
}
