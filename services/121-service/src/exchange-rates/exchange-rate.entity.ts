import { Column, Entity } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';

@Entity('exchange_rate')
export class ExchangeRateEntity extends Base121Entity {
  @Column({ nullable: false })
  public currency: string;

  @Column({ type: 'real' })
  public euroExchangeRate: number;

  @Column({ type: 'character varying', nullable: true })
  public closeTime: string | null;
}
