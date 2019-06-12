import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity('country')
export class CountryEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  country: string;

  @Column("numeric", {array:true, nullable: true})
  criteriumIds: number[];

}
