import { Entity, Column, OneToMany } from 'typeorm';
import { Base121Entity } from '../../base.entity';
import { ImageCodeExportVouchersEntity } from '../imagecode/image-code-export-vouchers.entity';

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

  @Column({ nullable: true })
  public amount: number;

  @Column({ nullable: true })
  public send: boolean;

  @Column({ default: false })
  public balanceUsed: boolean;

  @OneToMany(
    _type => ImageCodeExportVouchersEntity,
    image => image.barcode,
  )
  public image: ImageCodeExportVouchersEntity[];
}
