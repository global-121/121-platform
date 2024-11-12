import { FoundProgramDto } from '@121-service/src/programs/dto/found-program.dto';
import { Attribute as AttributeFrom121Service } from '@121-service/src/registration/enum/registration-attribute.enum';
import { GetUserReponseDto } from '@121-service/src/user/dto/get-user-response.dto';
import { AssignmentResponseDTO } from '@121-service/src/user/dto/userrole-response.dto';

import { Dto } from '~/utils/dto-type';

export type Project = Dto<FoundProgramDto>;

export type ProjectUser = Dto<GetUserReponseDto>;

export type ProjectUserAssignment = Dto<AssignmentResponseDTO>;

export type ProjectUserWithRolesLabel = {
  allRolesLabel: string;
  lastLogin?: Date;
} & Omit<ProjectUser, 'lastLogin'>;

export type Attribute = Dto<AttributeFrom121Service>;

export type AttributeWithTranslatedLabel = { label: string } & Omit<
  Attribute,
  'label'
>;
