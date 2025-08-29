import { GetProjectAttachmentResponseDto } from '@121-service/src/projects/project-attachments/dtos/get-project-attachment-response.dto';
import { ProjectAttachmentEntity } from '@121-service/src/projects/project-attachments/project-attachment.entity';

export class ProjectAttachmentMapper {
  public static mapEntitiesToDtos(
    entities: ProjectAttachmentEntity[],
  ): GetProjectAttachmentResponseDto[] {
    return entities.map((entity) =>
      ProjectAttachmentMapper.mapEntityToDto(entity),
    );
  }

  public static mapEntityToDto(
    entity: ProjectAttachmentEntity,
  ): GetProjectAttachmentResponseDto {
    return {
      id: entity.id,
      created: entity.created,
      updated: entity.updated,
      projectId: entity.projectId,
      user: {
        id: entity.user.id,
        username: entity.user.username,
      },
      filename: entity.filename,
      mimetype: entity.mimetype,
    };
  }
}
