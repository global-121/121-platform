import { Column, Entity, JoinColumn, ManyToOne, Relation } from 'typeorm';

import { Base121Entity } from '@121-service/src/base.entity';
import { ProjectEntity } from '@121-service/src/projects/project.entity';
import { UserEntity } from '@121-service/src/user/user.entity';

@Entity('project_attachment')
export class ProjectAttachmentEntity extends Base121Entity {
  @ManyToOne((_type) => ProjectEntity, (project) => project.attachments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'projectId' })
  public project: Relation<ProjectEntity>;
  @Column()
  public projectId: number;

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
