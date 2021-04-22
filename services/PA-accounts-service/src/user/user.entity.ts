import { Entity, PrimaryGeneratedColumn, Column, BeforeInsert } from 'typeorm';
import crypto from 'crypto';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public username: string;

  @Column()
  public password: string;

  @BeforeInsert()
  public hashPassword(): void {
    this.password = crypto.createHmac('sha256', this.password).digest('hex');
  }

  @Column({ default: null })
  public referenceId: string;
}
