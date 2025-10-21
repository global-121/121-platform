import { GetProgramAttachmentResponseDto } from '@121-service/src/programs/program-attachments/dtos/get-program-attachment-response.dto';
import { ProgramAttachmentEntity } from '@121-service/src/programs/program-attachments/program-attachment.entity';

export class ProgramAttachmentMapper {
  public static mapEntitiesToDtos(
    entities: ProgramAttachmentEntity[],
  ): GetProgramAttachmentResponseDto[] {
    return entities.map((entity: any) =>
      ProgramAttachmentMapper.mapEntityToDto(entity),
    );
  }

  public static mapEntityToDto(
    entity: ProgramAttachmentEntity,
  ): GetProgramAttachmentResponseDto {
    return {
      id: entity.id,
      created: entity.created,
      updated: entity.updated,
      programId: entity.programId,
      user: {
        id: entity.user.id,
        username: entity.user.username,
      },
      filename: entity.filename,
      mimetype: entity.mimetype,
    };
  }
}
