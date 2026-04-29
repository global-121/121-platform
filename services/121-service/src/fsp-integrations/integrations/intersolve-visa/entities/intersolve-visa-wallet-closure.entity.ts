import { Column, Entity, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { IntersolveVisaChildWalletEntity } from '@121-service/src/fsp-integrations/integrations/intersolve-visa/entities/intersolve-visa-child-wallet.entity';

@Entity('intersolve_visa_wallet_closure')
export class IntersolveVisaWalletClosureEntity extends Base121Entity {
  @OneToOne(() => IntersolveVisaChildWalletEntity, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'intersolveVisaChildWalletId' })
  public intersolveVisaChildWallet: Relation<IntersolveVisaChildWalletEntity>;

  @Column({ type: 'int' })
  public intersolveVisaChildWalletId: number;

  @Column({ type: 'int' })
  public amountBookedBackInCents: number;
}
