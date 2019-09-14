import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('country')
export class CountryEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public country: string;

  @Column('numeric', { array: true, nullable: true })
  public criteriumIds: number[];
}
