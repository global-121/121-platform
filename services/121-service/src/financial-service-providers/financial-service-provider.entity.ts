import { CascadeDeleteEntity } from '@121-service/src/base.entity';
import { FinancialServiceProviderIntegrationType } from '@121-service/src/financial-service-providers/enum/financial-service-provider-integration-type.enum';
import { FspQuestionEntity } from '@121-service/src/financial-service-providers/fsp-question.entity';
import { TransactionEntity } from '@121-service/src/payments/transactions/transaction.entity';
import { ProgramFspConfigurationEntity } from '@121-service/src/programs/fsp-configuration/program-fsp-configuration.entity';
import { ProgramEntity } from '@121-service/src/programs/program.entity';
import { Attribute } from '@121-service/src/registration/enum/custom-data-attributes';
import { ApiProperty } from '@nestjs/swagger';
import { LocalizedString } from 'src/shared/enum/language.enums';
import { Column, Entity, ManyToMany, OneToMany } from 'typeorm';

@Entity('financial_service_provider')
export class FinancialServiceProviderEntity extends CascadeDeleteEntity {
  @Column({ unique: true })
  @ApiProperty({ example: 'fspName' })
  public fsp: string;

  @Column('json', { nullable: true })
  @ApiProperty({ example: { en: 'FSP display name' } })
  public displayName: LocalizedString | null;

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
