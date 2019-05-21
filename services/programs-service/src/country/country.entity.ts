import {Entity, PrimaryGeneratedColumn, Column, BeforeUpdate, ManyToOne, OneToMany} from "typeorm";
import { UserEntity } from '../user/user.entity';

@Entity('country')
export class CountryEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  country: string;

  @Column("numeric", {array:true, nullable: true})
  criteriumIds: number[];

}
