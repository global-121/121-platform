import { TransactionEntity } from '../programs/program/transactions.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  BeforeUpdate,
} from 'typeorm';
import { FinancialServiceProviderEntity } from '../programs/fsp/financial-service-provider.entity';
import { ImageCodeExportVouchersEntity } from '../notifications/imagecode/image-code-export-vouchers.entity';
import { IsInt, IsPositive } from 'class-validator';

@Entity('connection')
export class ConnectionEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ unique: true, nullable: true })
  public referenceId: string;

  @Column({ nullable: true })
  public phoneNumber: string;

  @Column({ nullable: true })
  public namePartnerOrganization: string;

  @Column({ nullable: true })
  public preferredLanguage: string;

  @ManyToOne(
    type => FinancialServiceProviderEntity,
    financialServiceProvider => financialServiceProvider.connection,
  )
  public fsp: FinancialServiceProviderEntity;

  @Column({ nullable: true })
  public qrIdentifier: string;

  @Column({ nullable: true, type: 'bigint' })
  public inclusionScore: number;

  @Column('numeric', {
    array: true,
    default: () => 'array[]::integer[]',
    nullable: true,
  })
  public programsApplied: number[];

  @Column('numeric', {
    array: true,
    default: () => 'array[]::integer[]',
    nullable: true,
  })
  public programsEnrolled: number[];

  @Column('numeric', {
    array: true,
    default: () => 'array[]::integer[]',
    nullable: true,
  })
  public programsIncluded: number[];

  @Column('numeric', {
    array: true,
    default: () => 'array[]::integer[]',
    nullable: true,
  })
  public programsRejected: number[];

  @Column('json', {
    default: {},
  })
  public customData: JSON;

  @Column({ nullable: true })
  public note: string;

  @Column({ nullable: true })
  public noteUpdated: Date;

  @Column({ nullable: true })
  @IsInt()
  @IsPositive()
  public paymentAmountMultiplier: number;

  @OneToMany(
    type => TransactionEntity,
    transactions => transactions.connection,
  )
  public transactions: TransactionEntity[];

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  public created: Date;

  @Column({
    type: 'timestamp',
    default: () => null,
    nullable: true,
  })
  public importedDate: Date;

  @Column({
    type: 'timestamp',
    default: () => null,
    nullable: true,
  })
  public invitedDate: Date;

  @Column({
    type: 'timestamp',
    default: () => null,
    nullable: true,
  })
  public noLongerEligibleDate: Date;

  @Column({
    type: 'timestamp',
    default: () => null,
    nullable: true,
  })
  public accountCreatedDate: Date;

  @Column({
    type: 'timestamp',
    default: () => null,
    nullable: true,
  })
  public appliedDate: Date;

  @Column({
    type: 'timestamp',
    default: () => null,
    nullable: true,
  })
  public selectedForValidationDate: Date;

  @Column({
    type: 'timestamp',
    default: () => null,
    nullable: true,
  })
  public validationDate: Date;

  @Column({
    type: 'timestamp',
    default: () => null,
    nullable: true,
  })
  public inclusionDate: Date;

  @Column({
    type: 'timestamp',
    default: () => null,
    nullable: true,
  })
  public inclusionEndDate: Date;

  @Column({
    type: 'timestamp',
    default: () => null,
    nullable: true,
  })
  public rejectionDate: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: true,
  })
  public updated: Date;

  @BeforeUpdate()
  public updateTimestamp(): void {
    this.updated = new Date();
  }

  @OneToMany(
    type => ImageCodeExportVouchersEntity,
    image => image.connection,
  )
  public images: ImageCodeExportVouchersEntity[];
}
