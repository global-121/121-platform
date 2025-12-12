import { Column, Entity, JoinColumn, OneToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { RegistrationEntity } from '@121-service/src/registration/entities/registration.entity';

@Entity('cooperative_bank_of_oromia_account_validation')
export class CooperativeBankOfOromiaAccountValidationEntity extends Base121Entity {
  @OneToOne(() => RegistrationEntity, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'registrationId' })
  public registration: Relation<RegistrationEntity>;
  @Column({ type: 'int', nullable: false })
  public registrationId: number;

  @Column({ type: 'character varying', nullable: true })
  public nameUsedForTheMatch: string | null;

  @Column({ type: 'character varying', nullable: true })
  public bankAccountNumberUsedForCall: string | null;

  @Column({ type: 'character varying', nullable: true })
  public cooperativeBankOfOromiaName: string | null;

  @Column({ type: 'character varying', nullable: true })
  public errorMessage: string | null;
}
