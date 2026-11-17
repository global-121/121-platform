import { Column, Entity, Index, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Entity('user_api_key')
export class UserApiKeyEntity extends Base121Entity {
  @OneToOne(() => UserEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;
  @Column()
  public userId: number;

  @Index({ unique: true })
  @Column({ type: 'character varying' })
  public apiKey: string;
}
