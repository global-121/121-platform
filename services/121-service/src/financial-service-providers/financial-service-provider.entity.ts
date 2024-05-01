import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
import { CascadeDeleteEntity } from '../base.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { ProgramFspConfigurationEntity } from '../programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramEntity } from '../programs/program.entity';
import { Attribute } from '../registration/enum/custom-data-attributes';
import { FinancialServiceProviderIntegrationType } from '../financial-service-providers/enum/financial-service-provider-integration-type.enum';
import { FspQuestionEntity } from './fsp-question.entity';

@Entity('financial_service_provider')
export class FinancialServiceProviderEntity extends CascadeDeleteEntity {
  @Column({ unique: true })
  @ApiProperty({ example: 'fspName' })
  public fsp: string;

  @Column('json', { nullable: true })
  @ApiProperty({ example: { en: 'FSP display name' } })
  public displayName: JSON;

  @Column({ default: FinancialServiceProviderIntegrationType.api })
  @ApiProperty({ example: FinancialServiceProviderIntegrationType.api })
  public integrationType: FinancialServiceProviderIntegrationType;

  @Column({ default: false })
  @ApiProperty({
    example: false,
    description: 'Only relevant for integrationType=csv/xml',
  })
  public hasReconciliation: boolean;

  @Column({ default: false })
  @ApiProperty({ example: false })
  public notifyOnTransaction: boolean;

  @OneToMany((_type) => FspQuestionEntity, (questions) => questions.fsp)
  public questions: FspQuestionEntity[];

  @ManyToMany(
    (_type) => ProgramEntity,
    (program) => program.financialServiceProviders,
  )
  public program: ProgramEntity[];

  @OneToMany(
    (_type) => TransactionEntity,
    (transactions) => transactions.financialServiceProvider,
  )
  public transactions: TransactionEntity[];

  @OneToMany(
    (_type) => ProgramFspConfigurationEntity,
    (programFspConfiguration) => programFspConfiguration.fsp,
  )
  public configuration: ProgramFspConfigurationEntity[];

  public editableAttributes?: Attribute[];
}
