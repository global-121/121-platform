import { HealthController } from '@121-service/src/health/health.controller';
import { Dto121Service } from '~/utils/dto-type';

export type VersionInfo = Dto121Service<HealthController['version']>;
