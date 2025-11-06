import { FoundProgramDto } from '@121-service/src/programs/dto/found-program.dto';
import { GetProgramAttachmentResponseDto } from '@121-service/src/programs/program-attachments/dtos/get-program-attachment-response.dto';
import { Attribute as AttributeFrom121Service } from '@121-service/src/registration/enum/registration-attribute.enum';
import { GetUserReponseDto } from '@121-service/src/user/dto/get-user-response.dto';
import { AssignmentResponseDTO } from '@121-service/src/user/dto/userrole-response.dto';

import { Dto } from '~/utils/dto-type';

export type Project = Dto<FoundProgramDto>;

export type ProjectUser = Dto<GetUserReponseDto>;

export enum ProjectAttachmentFileType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  PDF = 'pdf',
}
export type ProjectAttachment = {
  fileType: ProjectAttachmentFileType;
} & Dto<GetProgramAttachmentResponseDto>;

export type ProjectUserAssignment = Dto<AssignmentResponseDTO>;

export type ProjectUserWithRolesLabel = {
  allRolesLabel: string;
} & ProjectUser;

export type Attribute = Dto<AttributeFrom121Service>;

export type AttributeWithTranslatedLabel = {
  translatedLabel: string;
} & Attribute;
