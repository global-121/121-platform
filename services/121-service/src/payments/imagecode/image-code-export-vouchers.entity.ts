import { Base121Entity } from '@121-service/src/base.entity';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/intersolve-voucher.entity';
import { RegistrationEntity } from '@121-service/src/registration/registration.entity';
import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';

@Entity('imagecode_export_vouchers')
export class ImageCodeExportVouchersEntity extends Base121Entity {
  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.images,
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column({ type: 'int', nullable: true })
  public registrationId: number | null;

  @ManyToOne((_type) => IntersolveVoucherEntity, (voucher) => voucher.image)
  public voucher: Relation<IntersolveVoucherEntity>;
}
