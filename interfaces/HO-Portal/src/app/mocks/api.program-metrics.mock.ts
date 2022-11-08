import RegistrationStatus from '../enums/registration-status.enum';
import {
  PeopleMetricsAttribute,
  ProgramMetrics,
} from '../models/program-metrics.model';
import { getRandomInt } from './helpers';

export default {
  updated: new Date().toISOString(),
  pa: {
    [RegistrationStatus.imported]: getRandomInt(0, 100),
    [RegistrationStatus.invited]: getRandomInt(0, 100),
    [RegistrationStatus.noLongerEligible]: getRandomInt(0, 100),
    [RegistrationStatus.startedRegistration]: getRandomInt(0, 100),
    [RegistrationStatus.registered]: getRandomInt(0, 100),
    [RegistrationStatus.selectedForValidation]: getRandomInt(0, 100),
    [RegistrationStatus.validated]: getRandomInt(0, 100),
    [RegistrationStatus.included]: getRandomInt(0, 100),
    [RegistrationStatus.inclusionEnded]: getRandomInt(0, 100),
    [RegistrationStatus.rejected]: getRandomInt(0, 100),
    [RegistrationStatus.deleted]: getRandomInt(0, 100),
    [PeopleMetricsAttribute.totalPaHelped]: getRandomInt(0, 100),
  },
} as ProgramMetrics;
