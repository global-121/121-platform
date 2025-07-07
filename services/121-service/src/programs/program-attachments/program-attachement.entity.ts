import { Column, Entity } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';

@Entity('program_attachment')
export class ProgramAttachmentEntity extends Base121Entity {
  // ##TODO: relationship to program needs to be added

  // ##TODO: relationship to user needs to be added
  @Column()
  public fileName: string;

  @Column()
  public mimeType: string;

  @Column()
  public blobName: string;
}
