import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProgramEntity } from '@121-service/src/programs/entities/program.entity';
import { UserEntity } from '@121-service/src/user/entities/user.entity';

@Entity('program_attachment')
export class ProgramAttachmentEntity extends Base121Entity {
  @ManyToOne((_type) => ProgramEntity, (program) => program.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'programId' })
  public program: Relation<ProgramEntity>;
  @Column()
  public programId: number;

  @ManyToOne(() => UserEntity, (user) => user.uploadedAttachments, {
    onDelete: 'NO ACTION', // Do not delete on deleting users, instead see catch in userService.delete()
  })
  @JoinColumn({ name: 'userId' })
  public user: Relation<UserEntity>;
  @Column()
  public userId: number;

  @Column()
  public filename: string;

  @Column()
  public mimetype: string;

  @Column()
  public blobName: string;
}
