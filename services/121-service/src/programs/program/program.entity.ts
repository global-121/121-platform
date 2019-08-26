import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  BeforeUpdate,
} from 'typeorm';
import { UserEntity } from '../../user/user.entity';
import { CustomCriterium } from './custom-criterium.entity';
import { CredentialRequestEntity } from '../../sovrin/credential/credential-request.entity';
import { CredentialEntity } from '../../sovrin/credential/credential.entity';

@Entity('program')
export class ProgramEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public location: string;

  @Column('json')
  public title: JSON;

  @Column()
  public startDate: Date;

  @Column()
  public endDate: Date;

  @Column()
  public currency: string;

  @Column('json')
  public distributionFrequency: string;

  @Column()
  public distributionChannel: string;

  @Column({ default: false })
  public notifiyPaArea: boolean;

  @Column({ default: null })
  public notificationType: string;

  @Column('json')
  public cashDistributionSites: JSON;

  @Column('json')
  public financialServiceProviders: JSON;

  @Column()
  public inclusionCalculationType: string;

  @Column('json')
  public meetingDocuments: JSON;

  @Column()
  public minimumScore: number;

  @Column('json')
  public description: JSON;

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

  @OneToMany(type => UserEntity, aidworker => aidworker.assignedProgram)
  public aidworkers: UserEntity[];

  @OneToMany(
    type => CredentialRequestEntity,
    credentialRequest => credentialRequest.program,
  )
  public credentialRequests: CredentialRequestEntity[];

  @OneToMany(type => CredentialEntity, credential => credential.program)
  public credentials: CredentialEntity[];
}
