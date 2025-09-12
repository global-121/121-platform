import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { IntersolveVoucherEntity } from '@121-service/src/payments/fsp-integration/intersolve-voucher/entities/intersolve-voucher.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

@Entity('imagecode_export_vouchers')
export class ImageCodeExportVouchersEntity extends Base121Entity {
  @ManyToOne(
    (_type) => RegistrationEntity,
    (registration) => registration.images,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column({ type: 'int', nullable: false })
  public registrationId: number;

  @ManyToOne((_type) => IntersolveVoucherEntity, (voucher) => voucher.image, {
    onDelete: 'CASCADE',
  })
  public voucher: Relation<IntersolveVoucherEntity>;
}
