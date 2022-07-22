import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { Base121Entity } from '../base.entity';
import { RegistrationDataEntity } from '../registration/registration-data.entity';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';

@Entity('fsp_attribute')
export class FspQuestionEntity extends Base121Entity {
  @Column()
  public name: string;

  @Column('json')
  public label: JSON;

  @Column('json', { nullable: true })
  public placeholder: JSON;

  @Column('json', { nullable: true })
  public options: JSON;

  @Column('json', {
    default: ['all-people-affected', 'included', 'selected-for-validation'],
  })
  public export: JSON;

  @Column()
  public answerType: string;

  @Column({ default: false })
  public duplicateCheck: boolean;

  @Column('json', { default: [] })
  public phases: JSON;

  @ManyToOne(
    _type => FinancialServiceProviderEntity,
    fsp => fsp.questions,
  )
  public fsp: FinancialServiceProviderEntity;

  @OneToMany(
    () => RegistrationDataEntity,
    registrationData => registrationData.fspQuestion,
  )
  public registrationData: RegistrationDataEntity[];
}
