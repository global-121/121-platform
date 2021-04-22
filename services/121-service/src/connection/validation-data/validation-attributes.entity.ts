import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('validation_data_attributes')
export class ValidationDataAttributesEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public referenceId: string;

  @Column()
  public programId: number;

  @Column()
  public attributeId: number;

  @Column()
  public attribute: string;

  @Column()
  public answer: string;
}
