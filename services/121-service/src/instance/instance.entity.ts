import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('instance')
export class InstanceEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @Column('json')
  public displayName: JSON;

  @Column('json', { nullable: true, default: null })
  public logoUrl: JSON;

  @Column('json', { nullable: true, default: null })
  public dataPolicy: JSON;

  @Column('json', { nullable: true, default: null })
  public aboutProgram: JSON;

  @Column('json', { nullable: true, default: null })
  public contactDetails: JSON;

  @Column('json', { nullable: true, default: null })
  public monitoringQuestion: JSON;
}
