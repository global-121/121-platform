import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('schema')
export class SchemaEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public name: string;

  @Column()
  public schemaId: string;

  @Column()
  public attributes: string;

  @Column()
  public credDefId: string;

  @Column()
  public criteriums: string;
}
