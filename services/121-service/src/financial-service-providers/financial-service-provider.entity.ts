import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/enum/financial-service-provider-integration-type.enum';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramFinancialServiceProviderConfigurationEntity } from '@121-service/src/program-financial-service-provider-configurations/program-financial-service-provider-configuration.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { Attribute } from '@121-service/src/registration/enum/custom-data-attributes';
import { LocalizedString } from '@121-service/src/shared/types/localized-string.type';
import { WrapperType, getEnumValue } from '@121-service/src/wrapper.type';
import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, ManyToMany, OneToMany, Relation } from 'typeorm';

@Entity('financial_service_provider')
export class FinancialServiceProviderEntity extends CascadeDeleteEntity {
  @Column({ unique: true })
  @ApiProperty({ example: 'fspName' })
  public fsp: string;

  @Column('json', { nullable: true })
  @ApiProperty({ example: { en: 'FSP display name' } })
  public displayName: LocalizedString | null;

  @Column({
    default: FinancialServiceProviderIntegrationType.api,
    type: 'character varying',
  })
  @ApiProperty({
    example: getEnumValue(FinancialServiceProviderIntegrationType.api),
  })
  public integrationType: WrapperType<FinancialServiceProviderIntegrationType>;

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
  public questions: Relation<FspQuestionEntity[]>;

  @ManyToMany(
    (_type) => ProgramEntity,
    (program) => program.financialServiceProviders,
  )
  public program: Relation<ProgramEntity[]>;

  @OneToMany(
    (_type) => TransactionEntity,
    (transactions) => transactions.financialServiceProvider,
  )
  public transactions: Relation<TransactionEntity[]>;

  @OneToMany(
    (_type) => ProgramFinancialServiceProviderConfigurationEntity,
    (programFspConfiguration) => programFspConfiguration.fsp,
  )
  public configuration: Relation<
    ProgramFinancialServiceProviderConfigurationEntity[]
  >;

  public editableAttributes?: Attribute[];
}
