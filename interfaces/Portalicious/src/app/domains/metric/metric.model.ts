import { ProgramStats } from '@121-service/src/metrics/dto/program-stats.dto';

import { Dto } from '~/utils/dto-type';
// TODO: AB#30152 This type should be refactored to use Dto121Service
export type ProjectMetrics = Dto<ProgramStats>;
