import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('safaricom_request')
export class SafaricomRequestEntity {
  @PrimaryGeneratedColumn()
  public id: number;

  @Column()
  public initiatorName: string;

  @Column()
  public securityCredential: string;

  @Column()
  public commandID: string;

  @Column()
  public amount: number;

  @Column()
  public partyA: string;

  @Column()
  public partyB: string;

  @Column()
  public remarks: string;

  @Column()
  public queueTimeOutURL: string;

  @Column()
  public resultURL: string;

  @Column()
  public occassion: string;

  @Column()
  public status: string;

  @Column('json', {
    default: {},
  })
  public requestResult?: JSON;

  @Column('json', {
    default: {},
  })
  public paymentResult?: JSON;
}
