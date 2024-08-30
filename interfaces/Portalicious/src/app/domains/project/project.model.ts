import { ProgramStats } from '@121-service/src/metrics/dto/program-stats.dto';
import { ProgramController } from '@121-service/src/programs/programs.controller';
import { UserController } from '@121-service/src/user/user.controller';
import { Dto, Dto121Service } from '~/utils/dto-type';
import { ArrayElement } from '~/utils/type-helpers';

export type Project = Dto121Service<ProgramController['findOne']>;

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
