import { Column, Entity, Index, OneToMany } from 'typeorm';
import { Base121Entity } from '../../../base.entity';
import { ImageCodeExportVouchersEntity } from '../../imagecode/image-code-export-vouchers.entity';

@Entity('intersolve_barcode')
export class IntersolveBarcodeEntity extends Base121Entity {
  @Column({ nullable: true })
  public payment: number;

  @Column({ nullable: true })
  public whatsappPhoneNumber: string;

  @Column()
  public pin: string;

  @Column()
  public barcode: string;

  // The amount with which the voucher was originally created
  @Column({ nullable: true, type: 'real' })
  public amount: number;

  @Index()
  @Column({ nullable: true })
  public send: boolean;

  @Index()
  @Column({ default: false })
  public balanceUsed: boolean;

  // The last known balance we got from intersolve
  @Index()
  @Column({ nullable: true, default: null, type: 'real' })
  public lastRequestedBalance: number;

  @Column({ nullable: true, default: null })
  public updatedLastRequestedBalance: Date;

  @Column({ nullable: true })
  public reminderCount: number;

  @OneToMany((_type) => ImageCodeExportVouchersEntity, (image) => image.barcode)
  public image: ImageCodeExportVouchersEntity[];
}
