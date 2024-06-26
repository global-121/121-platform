import { Base121Entity } from '@121-service/src/base.entity';
import { Column, Entity } from 'typeorm';

export interface AfricasTalkingNotificationRequestMetadata {
  programId: string;
  payment: string;
  referenceId: string;
  amount: string;
}

// TODO: REFACTOR: rename the database table into africas_talking_notification so it aligns with Entity class name
@Entity('at_notification')
export class AfricasTalkingNotificationEntity extends Base121Entity {
  // TODO: REFACTOR: into a JoinColumn with the Transaction Entity
  @Column()
  public transactionId: string;

  @Column()
  public category: string;

  @Column()
  public provider: string;

  @Column({ type: 'character varying', nullable: true })
  public providerRefId: string | null;

  @Column()
  public providerChannel: string;

  @Column({ type: 'character varying', nullable: true })
  public clientAccount: string | null;

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

  @Column({ type: 'character varying', nullable: true })
  public transactionFee: string | null;

  @Column({ type: 'character varying', nullable: true })
  public providerFee: string | null;

  @Column()
  public status: string;

  @Column()
  public description: string;

  @Column('json', { default: null })
  public requestMetadata: AfricasTalkingNotificationRequestMetadata;

  @Column('json', { default: null })
  public providerMetadata: Record<string, unknown>;

  @Column({ type: 'character varying', nullable: true })
  public transactionDate: string | null;
}
