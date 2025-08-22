import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Relation,
} from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { PaymentEntity } from '@121-service/src/payments/entities/payment.entity';
import { ImageCodeExportVouchersEntity } from '@121-service/src/payments/imagecode/image-code-export-vouchers.entity';
import { UserEntity } from '@121-service/src/user/user.entity';
@Entity('intersolve_voucher')
export class IntersolveVoucherEntity extends Base121Entity {
  @ManyToOne(() => PaymentEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'paymentId' })
  public payment: Relation<PaymentEntity>;
  @Index()
  @Column({ type: 'integer', nullable: true })
  public paymentId: number | null;

  @Column({ type: 'character varying', nullable: true })
  public whatsappPhoneNumber: string | null;

  @Column()
  public pin: string;

  @Column()
  public barcode: string;

  // The amount with which the voucher was originally created
  @Column({ nullable: true, type: 'real' })
  public amount: number | null;

  @Index()
  @Column({ type: 'boolean', nullable: true })
  public send: boolean | null;

  @Index()
  @Column({ default: false })
  public balanceUsed: boolean;

  // The last known balance we got from intersolve
  @Index()
  @Column({ nullable: true, default: null, type: 'real' })
  public lastRequestedBalance: number | null;

  @Column({ nullable: true, default: null, type: 'timestamp' })
  public updatedLastRequestedBalance: Date | null;

  @Index()
  @Column({ nullable: true, default: 0, type: 'integer' })
  public reminderCount: number | null;

  @OneToMany((_type) => ImageCodeExportVouchersEntity, (image) => image.voucher)
  public image: Relation<ImageCodeExportVouchersEntity[]>;

  @ManyToOne(() => UserEntity, { onDelete: 'NO ACTION' }) // Do not delete on deleting users, instead see catch in userService.delete()
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;
  @Column()
  public userId: number;
}
