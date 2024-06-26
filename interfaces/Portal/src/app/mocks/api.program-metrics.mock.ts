import RegistrationStatus from '../enums/registration-status.enum';
import { ProgramMetrics } from '../models/program-metrics.model';
import { getRandomInt } from './helpers';

export default {
  updated: new Date().toISOString(),
  pa: {
    [RegistrationStatus.registered]: getRandomInt(0, 100),
    [RegistrationStatus.validated]: getRandomInt(0, 100),
    [RegistrationStatus.declined]: getRandomInt(0, 100),
    [RegistrationStatus.included]: getRandomInt(0, 100),
    [RegistrationStatus.deleted]: getRandomInt(0, 100),
  },
} as ProgramMetrics;
