import { MetricsController } from '@121-service/src/metrics/metrics.controller';
import { ProgramController } from '@121-service/src/programs/programs.controller';
import { Dto121Service } from '~/utils/dto-type';

export type Program = Dto121Service<ProgramController['findOne']>;

export type ProgramMetrics = Dto121Service<
  MetricsController['getProgramStats']
>;
