import { ProgramStats } from '@121-service/src/metrics/dto/program-stats.dto';
import { FoundProgramDto } from '@121-service/src/programs/dto/found-program.dto';
import { Attribute as AttributeFrom121Service } from '@121-service/src/registration/enum/custom-data-attributes';
import { UserController } from '@121-service/src/user/user.controller';

import { Dto, Dto121Service } from '~/utils/dto-type';
import { ArrayElement } from '~/utils/type-helpers';

// TODO: AB#30152 This type should be refactored to use Dto121Service
export type Project = Dto<FoundProgramDto>;

// TODO: AB#30152 This type should be refactored to use Dto121Service
export type ProjectMetrics = Dto<ProgramStats>;

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

// TODO: AB#30152 This type should be refactored to use Dto121Service
export type Attribute = Dto<AttributeFrom121Service>;
