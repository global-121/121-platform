import { ApiProperty } from '@nestjs/swagger';
import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { Base121Entity } from '../base.entity';
import { ExportType } from '../metrics/dto/export-details.dto';
import { RegistrationDataEntity } from '../registration/registration-data.entity';
import { NameConstraintQuestions } from '../shared/const';
import { FinancialServiceProviderEntity } from './financial-service-provider.entity';

@Unique('fspQuestionUnique', ['name', 'fspId'])
@Entity('financial_service_provider_question')
@Check(`"name" NOT IN (${NameConstraintQuestions})`)
export class FspQuestionEntity extends Base121Entity {
  @Column()
  @ApiProperty({ example: 'name' })
  public name: string;

  @Column('json')
  @ApiProperty({ example: { en: 'label' } })
  public label: JSON;

  @Column('json', { nullable: true })
  @ApiProperty({ example: { en: 'placeholder' } })
  public placeholder: JSON;

  @Column('json', { nullable: true })
  @ApiProperty({ example: [] })
  public options: JSON;

  @Column('json', {
    default: [ExportType.allPeopleAffected, ExportType.included],
  })
  @ApiProperty({ example: [] })
  public export: JSON;

  @Column({ nullable: true })
  @ApiProperty({ example: 'pattern' })
  public pattern: string;

  @Column()
  @ApiProperty({ example: 'tel' })
  public answerType: string;

  @Column({ default: false })
  @ApiProperty({ example: false })
  public duplicateCheck: boolean;

  @Column({ default: false })
  @ApiProperty({ example: false })
  public showInPeopleAffectedTable: boolean;

  @ManyToOne((_type) => FinancialServiceProviderEntity, (fsp) => fsp.questions)
  @JoinColumn({ name: 'fspId' })
  public fsp: FinancialServiceProviderEntity;
  @Column()
  public fspId: number;

  @OneToMany(
    () => RegistrationDataEntity,
    (registrationData) => registrationData.fspQuestion,
  )
  public registrationData: RegistrationDataEntity[];
}
