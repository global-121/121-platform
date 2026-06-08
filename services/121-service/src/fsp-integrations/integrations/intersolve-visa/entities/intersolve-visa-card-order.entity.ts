import { Column, Entity, Index, JoinColumn, ManyToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Entity('intersolve_visa_card_order')
export class VisaCardOrderEntity extends Base121Entity {
  @Index()
  @Column({ type: 'int' })
  public programId: number;

  @ManyToOne(() => UserEntity, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;

  @Column({ type: 'int' })
  public userId: number;

  @Column({ type: 'int' })
  public noOfCards: number;

  @Column({ type: 'int' })
  public noOfCardsOrdered: number;

  @Column({ type: 'character varying' })
  public city: string;

  @Column({ type: 'character varying' })
  public postalCode: string;

  @Column({ type: 'character varying' })
  public address: string;

  @Column({ type: 'character varying' })
  public addressee: string;
}
