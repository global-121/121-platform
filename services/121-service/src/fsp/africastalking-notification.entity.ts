import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Base121Entity } from '../base.entity';

@Entity('at_notification')
export class AfricasTalkingNotificationEntity extends Base121Entity {
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public timestamp: Date;

  @Column()
  public transactionId: string;

  @Column()
  public category: string;

  @Column()
  public provider: string;

  @Column({ nullable: true })
  public providerRefId: string;

  @Column()
  public providerChannel: string;

  @Column({ nullable: true })
  public clientAccount: string;

  @Column()
  public productName: string;

  @Column()
  public sourceType: string;

  @Column()
  public source: string;

  @Column()
  public destinationType: string;

  @Column()
  public destination: string;

  @Column()
  public value: string;

  @Column({ nullable: true })
  public transactionFee: string;

  @Column({ nullable: true })
  public providerFee: string;

  @Column()
  public status: string;

  @Column()
  public description: string;

  @Column('json', { default: null })
  public requestMetadata: JSON;

  @Column('json', { default: null })
  public providerMetadata: JSON;

  @Column({ nullable: true })
  public transactionDate: string;
}
