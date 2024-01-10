import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Base121Entity } from '../../base.entity';
import { RegistrationEntity } from '../../registration/registration.entity';
import { IntersolveVoucherEntity } from '../fsp-integration/intersolve-voucher/intersolve-voucher.entity';

@Entity('imagecode_export_vouchers')
export class ImageCodeExportVouchersEntity extends Base121Entity {
  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.images,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: RegistrationEntity;
  @Column({ type: 'int', nullable: true })
  public registrationId: number;

  @ManyToOne((_type) => IntersolveVoucherEntity, (voucher) => voucher.image)
  public voucher: IntersolveVoucherEntity;
}
