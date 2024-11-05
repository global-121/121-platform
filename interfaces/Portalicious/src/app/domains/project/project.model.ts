import { FoundProgramDto } from '@121-service/src/programs/dto/found-program.dto';
import { Attribute as AttributeFrom121Service } from '@121-service/src/registration/enum/registration-attribute.enum';
import { UserController } from '@121-service/src/user/user.controller';

import { Dto, Dto121Service } from '~/utils/dto-type';
import { ArrayElement } from '~/utils/type-helpers';

// TODO: AB#30152 This type should be refactored to use Dto121Service
export type Project = Dto<FoundProgramDto>;

export type ProjectUser = ArrayElement<
  Dto121Service<UserController['getUsersInProgram']>
>;

export type ProjectUserAssignment = Dto121Service<
  UserController['assignAidworkerToProgram']
>;

export type ProjectUserWithRolesLabel = {
  allRolesLabel: string;
  lastLogin?: Date;
} & Omit<ProjectUser, 'lastLogin'>;

export type Attribute = Dto<AttributeFrom121Service>;

export type AttributeWithTranslatedLabel = { label: string } & Omit<
  Attribute,
  'label'
>;
