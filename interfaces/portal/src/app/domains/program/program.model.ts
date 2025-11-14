import { FoundProgramDto } from '@121-service/src/programs/dto/found-program.dto';
import { GetProgramAttachmentResponseDto } from '@121-service/src/programs/program-attachments/dtos/get-program-attachment-response.dto';
import { Attribute as AttributeFrom121Service } from '@121-service/src/registration/enum/registration-attribute.enum';
import { GetUserReponseDto } from '@121-service/src/user/dto/get-user-response.dto';
import { AssignmentResponseDTO } from '@121-service/src/user/dto/userrole-response.dto';

import { Dto } from '~/utils/dto-type';

export type Program = Dto<FoundProgramDto>;

export type ProgramUser = Dto<GetUserReponseDto>;

export enum ProgramAttachmentFileType {
  DOCUMENT = 'document',
  IMAGE = 'image',
  PDF = 'pdf',
}
export type ProgramAttachment = {
  fileType: ProgramAttachmentFileType;
} & Dto<GetProgramAttachmentResponseDto>;

export type ProgramUserAssignment = Dto<AssignmentResponseDTO>;

export type ProgramUserWithRolesLabel = {
  allRolesLabel: string;
} & ProgramUser;

export type Attribute = Dto<AttributeFrom121Service>;

export type AttributeWithTranslatedLabel = { label: string } & Omit<
  Attribute,
  'label'
>;
