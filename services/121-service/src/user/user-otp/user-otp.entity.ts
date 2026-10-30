import { Column, Entity, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Entity('user_otp')
export class UserOtpEntity extends Base121Entity {
  @OneToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;
  @Column()
  public userId: number;

  @Column({ type: 'character varying' })
  public otp: string;

  @Column({ type: 'timestamp' })
  public issuedAt: Date;

  @Column({ type: 'timestamp' })
  public expiresAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  public consumedAt: Date | null;

  @Column({ default: 0 })
  public failedAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  public lockedUntil: Date | null;
}
