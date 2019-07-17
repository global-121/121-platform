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

@Entity('program')
export class ProgramEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public location: string;

  @Column()
  public title: string;

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

  @Column()
  public minimumScore: number;

  @Column({ default: '' })
  public description: string;

  @Column()
  public countryId: number;

  @Column({ default: false })
  public published: boolean;

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
}
