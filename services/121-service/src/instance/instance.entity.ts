import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { Base121Entity } from '../base.entity';
import { MonitoringQuestionEntity } from './monitoring-question.entity';

// TODO: enforce only 1 instance/record in the database
@Entity('instance')
export class InstanceEntity extends Base121Entity {
  @Column()
  @ApiProperty({ example: 'instance name' })
  public name: string;

  @Column('json')
  @ApiProperty({ example: { en: 'display name' } })
  public displayName: JSON;

  @Column('json', { nullable: true, default: null })
  @ApiProperty({ example: { en: 'logoURL' } })
  public logoUrl: JSON;

  @Column('json', { nullable: true, default: null })
  @ApiProperty({ example: { en: 'data policy' } })
  public dataPolicy: JSON;

  @Column('json', { nullable: true, default: null })
  @ApiProperty({ example: { en: 'contact details' } })
  public contactDetails: JSON;

  @OneToOne(
    () => MonitoringQuestionEntity,
    (monitoringQuestion) => monitoringQuestion.instance,
    {
      cascade: true,
    },
  )
  @JoinColumn()
  public monitoringQuestion: MonitoringQuestionEntity;
}
