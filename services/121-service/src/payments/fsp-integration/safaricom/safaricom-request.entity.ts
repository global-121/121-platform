import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('safaricom_request')
export class SafaricomRequestEntity {
  @PrimaryGeneratedColumn()
  public safaricomRequestId: number;

  @Column()
  public initiatorName: string;

  @Column()
  public securityCredential: string;

  @Column()
  public commandID: string;

  @Column()
  public amount: number;

  @Column()
  public to: string;

  @Column()
  public partyA: string;

  @Column()
  public partyB: string;

  @Column()
  public remarks: number;

  @Column()
  public queueTimeOutURL: number;

  @Column()
  public resultURL: string;

  @Column()
  public occassion: string;

  @Column()
  public status: string;
}
