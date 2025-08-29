import { FoundProjectDto } from '@121-service/src/projects/dto/found-project.dto';
import { GetProjectAttachmentResponseDto } from '@121-service/src/projects/project-attachments/dtos/get-project-attachment-response.dto';
import { Attribute as AttributeFrom121Service } from '@121-service/src/registration/enum/registration-attribute.enum';
import { GetUserReponseDto } from '@121-service/src/user/dto/get-user-response.dto';
import { AssignmentResponseDTO } from '@121-service/src/user/dto/userrole-response.dto';

import { Dto } from '~/utils/dto-type';

export type Project = Dto<FoundProjectDto>;

export type ProjectUser = Dto<GetUserReponseDto>;

export enum ProjectAttachmentFileType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  PDF = 'pdf',
}
export type ProjectAttachment = {
  fileType: ProjectAttachmentFileType;
} & Dto<GetProjectAttachmentResponseDto>;

export type ProjectUserAssignment = Dto<AssignmentResponseDTO>;

export type ProjectUserWithRolesLabel = {
  allRolesLabel: string;
} & ProjectUser;

export type Attribute = Dto<AttributeFrom121Service>;

export type AttributeWithTranslatedLabel = { label: string } & Omit<
  Attribute,
  'label'
>;
