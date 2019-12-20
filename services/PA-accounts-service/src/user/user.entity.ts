import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
} from 'typeorm';
const crypto = require('crypto');

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public username: string;

  @Column()
  public password: string;

  @BeforeInsert()
  public hashPassword() {
    this.password = crypto.createHmac('sha256', this.password).digest('hex');
  }

}
