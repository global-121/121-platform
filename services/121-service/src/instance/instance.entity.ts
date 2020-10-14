import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('instance')
export class InstanceEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @Column('json')
  public displayName: JSON;

  @Column('json')
  public dataPolicy: JSON;

  @Column('json', { nullable: true })
  public aboutProgram: JSON;

  @Column('json', { default: null })
  public contactDetails: JSON;
}
