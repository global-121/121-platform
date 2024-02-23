import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';
import { CascadeDeleteEntity } from '../base.entity';
import { TransactionEntity } from '../payments/transactions/transaction.entity';
import { ProgramFinancialServiceProviderConfigurationEntity } from '../programs/financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { ProgramEntity } from '../programs/program.entity';
import { Attribute } from '../registration/enum/custom-data-attributes';
import { FinancialServiceProviderIntegrationType } from './enum/financial-service-provider-integration-type.enum';
import { FinancialServiceProviderAttributeEntity } from './financial-service-provider-attribute.entity';

// TODO: REFACTOR: rename table name into financial_service_provider so that aligns with the Entity class name
@Entity()
export class FinancialServiceProviderEntity extends CascadeDeleteEntity {
  @Column({ unique: true })
  @ApiProperty({ example: 'name of financial service provider' })
  public name: string;

  @Column('json', { nullable: true })
  @ApiProperty({ example: { en: 'name of financial service provider to show in the PA App' } })
  public displayNamePaApp: JSON;

  @Column({ nullable: true })
  @ApiProperty({ example: 'name of financial service provider to show in the 121 Portal' })
  public displayNamePortal: string;

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

  @OneToMany((_type) => FinancialServiceProviderAttributeEntity, (questions) => questions.fsp)
  public questions: FinancialServiceProviderAttributeEntity[];

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
    (_type) => ProgramFinancialServiceProviderConfigurationEntity,
    (programFspConfiguration) => programFspConfiguration.financialServiceProvider,
  )
  public configuration: ProgramFinancialServiceProviderConfigurationEntity[];

  public editableAttributes?: Attribute[];
}
