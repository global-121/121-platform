import { ProgramStats } from '@121-service/src/metrics/dto/program-stats.dto';
import { ProgramController } from '@121-service/src/programs/programs.controller';
import { Dto121Service } from '~/utils/dto-type';

export type Project = Dto121Service<ProgramController['findOne']>;

export type ProjectMetrics = ProgramStats;
