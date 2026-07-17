import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Relation,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { VisaCardOrderStatus } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/enums/intersolve-visa-card-order-status.enum';
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
  public status: VisaCardOrderStatus;

  @Column({ type: 'character varying' })
  public addressStreet: string;

  @Column({ type: 'character varying' })
  public addressHouseNumber: string;

  @Column({ type: 'character varying', nullable: true })
  public addressHouseNumberAddition: string | null;

  @Column({ type: 'character varying' })
  public addressPostalCode: string;

  @Column({ type: 'character varying' })
  public addressCity: string;

  @Column({ type: 'character varying' })
  public addressee: string;

  @Column({ type: 'character varying' })
  public addresseePhoneNumber: string;
}
