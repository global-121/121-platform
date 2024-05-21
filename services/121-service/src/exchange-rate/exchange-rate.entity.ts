import { Base121Entity } from '@121-service/src/base.entity';
import { Column, Entity } from 'typeorm';

@Entity('exchange_rate')
export class ExchangeRateEntity extends Base121Entity {
  @Column({ nullable: false })
  public currency: string;

  @Column({ type: 'real' })
  public euroExchangeRate: number;

  @Column({ nullable: true })
  public closeTime: string | null;
}
