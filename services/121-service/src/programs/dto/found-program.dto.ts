import { ProgramFinancialServiceProviderConfigurationReturnDto } from '@121-service/src/program-financial-service-provider-configurations/dtos/program-financial-service-provider-configuration-return.dto';
import { ProgramEntity } from '@121-service/src/programs/program.entity';

// TODO: refactor this to be a proper DTO
export interface FoundProgramDto
  extends Omit<
      ProgramEntity,
      'monitoringDashboardUrl' | 'programFspConfiguration'
    >,
    Partial<Pick<ProgramEntity, 'monitoringDashboardUrl'>> {}
