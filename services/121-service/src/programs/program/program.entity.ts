import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  BeforeUpdate,
  ManyToMany,
  JoinTable,
  OneToOne,
} from 'typeorm';
import { UserEntity } from '../../user/user.entity';
import { CustomCriterium } from './custom-criterium.entity';
import { CredentialRequestEntity } from '../../sovrin/credential/credential-request.entity';
import { CredentialEntity } from '../../sovrin/credential/credential.entity';
import { ProtectionServiceProviderEntity } from './protection-service-provider.entity';
import { TransactionEntity } from './transactions.entity';
import { FinancialServiceProviderEntity } from '../fsp/financial-service-provider.entity';


@Entity('program')
export class ProgramEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column({ 'default': 'design' })
  public state: string;

  @Column()
  public location: string;

  @Column('json')
  public title: JSON;

  @Column()
  public ngo: string;

  @Column()
  public startDate: Date;

  @Column()
  public endDate: Date;

  @Column()
  public currency: string;

  @Column()
  public distributionFrequency: string;

  @Column()
  public distributionDuration: number;

  @Column()
  public fixedTransferValue: number;

  @ManyToMany(type => FinancialServiceProviderEntity, financialServiceProviders => financialServiceProviders.program)
  @JoinTable()
  public financialServiceProviders: FinancialServiceProviderEntity[];

  @ManyToMany(type => ProtectionServiceProviderEntity, protectionServiceProviders => protectionServiceProviders.program)
  @JoinTable()
  public protectionServiceProviders: ProtectionServiceProviderEntity[];

  @Column()
  public inclusionCalculationType: string;

  @Column()
  public minimumScore: number;

  @Column()
  public highestScoresX: number;

  @Column('json')
  public meetingDocuments: JSON;

  @Column('json')
  public notifications: JSON;

  @Column('json')
  public description: JSON;

  @Column('json')
  public descLocation: JSON;

  @Column('json')
  public descHumanitarianObjective: JSON;

  @Column('json')
  public descCashType: JSON;

  @Column()
  public countryId: number;

  @Column({ default: false })
  public published: boolean;

  @Column({ default: null })
  public schemaId: string;

  @Column({ default: null })
  public credDefId: string;

  @Column('json', { default: null })
  public credOffer: JSON;

  @Column({ default: null })
  public proofRequest: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public created: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public updated: Date;

  @BeforeUpdate()
  public updateTimestamp(): void {
    this.updated = new Date();
  }

  @ManyToOne(type => UserEntity, user => user.programs)
  public author: UserEntity;

  @OneToMany(type => CustomCriterium, customCriteria => customCriteria.program)
  public customCriteria: CustomCriterium[];

  @ManyToMany(type => UserEntity, aidworker => aidworker.assignedProgram)
  @JoinTable()
  public aidworkers: UserEntity[];

  @OneToMany(type => CredentialRequestEntity, credentialRequest => credentialRequest.program)
  public credentialRequests: CredentialRequestEntity[];

  @OneToMany(type => CredentialEntity, credential => credential.program)
  public credentials: CredentialEntity[];


  @OneToMany(type => TransactionEntity, transactions => transactions.program)
  public transactions: TransactionEntity[];

}
