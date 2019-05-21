import {Entity, PrimaryGeneratedColumn, Column, BeforeUpdate, ManyToOne, OneToMany} from "typeorm";
import { UserEntity } from '../user/user.entity';

@Entity('country')
export class CountryEntity {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  country: string;

  @Column("text", {array:true, nullable: true})
  criteriumIds: number[];

  @Column({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP"})
  created: Date;

  @Column({ type: 'timestamp', default: () => "CURRENT_TIMESTAMP"})
  updated: Date;

  @BeforeUpdate()
  updateTimestamp() {
    this.updated = new Date;
  }

}
